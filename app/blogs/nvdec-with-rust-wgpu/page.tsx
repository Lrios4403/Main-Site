import type { Metadata } from "next";
import SiteLayout from "@/components/site-layout/SiteLayout";
import ArticleShell from "@/components/article/ArticleShell";
import ArticleFigure from "@/components/article/ArticleFigure";
import ArticleTable from "@/components/article/ArticleTable";
import { CodeBlock } from "@/components/article/CodeBlock";
import FileTree from "@/components/article/FileTree";
import Note from "@/components/article/Note";
import ChartFigure from "@/components/article/charts/ChartFigure";
import { getPost } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/blog/metadata";
import { PipelineDiagram, pipelineText, SharedTextureDiagram, sharedText } from "./diagrams";
import * as src from "./code";

// Title, description, dates and tags live in lib/posts.ts
const info = getPost("nvdec-with-rust-wgpu");

export const metadata: Metadata = buildPostMetadata(info);

const NVDEC_GUIDE = "https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvdec-video-decoder-api-prog-guide/index.html";
const WGPU_DEVICE = "https://docs.rs/wgpu/30.0.1/wgpu/struct.Device.html";
const CUDA_INTEROP = "https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__EXTRES__INTEROP.html";
const D3D12_STATES = "https://learn.microsoft.com/en-us/windows/win32/direct3d12/using-resource-barriers-to-synchronize-resource-states-in-direct3d-12";
const SOURCE_READER = "https://learn.microsoft.com/en-us/windows/win32/medfound/processing-media-data-with-the-source-reader";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

// A verbatim excerpt of the project, labelled with its file and real line numbers
function Source({ excerpt, language }: { excerpt: src.Excerpt; language: string }) {
  const last = excerpt.start + excerpt.code.split("\n").length - 1;
  return <CodeBlock code={excerpt.code} language={language} startLine={excerpt.start}
    filename={excerpt.start === 1 ? excerpt.file : `${excerpt.file}, lines ${excerpt.start}–${last}`} />;
}

const COLOR_COMPARISON = {
  src: "/media/nvdec-with-rust-wgpu/colors-before-after.jpg",
  width: 1124,
  height: 500,
  alt: "Two captures of the cube at the same moment of the video. The left one, with the sRGB swapchain, is pale and washed out; the right one, with Bgra8Unorm, has noticeably stronger pinks and greens.",
  caption: "The same frame and angle before (left, sRGB swapchain) and after the fix (right, Bgra8Unorm).",
  credit: { name: "Big Buck Bunny © Blender Foundation, CC BY 3.0", url: "https://peach.blender.org/about/" },
};

export default function NvdecWithRustWgpu() {
  return (
    <SiteLayout variant="detail">
    <ArticleShell post={info}>
        <p>
          I wanted a video playing on a 3D object in a Rust program. That sounds like a solved problem, and in one sense it
          is: decode a frame with any library, copy its pixels into memory, upload them to the GPU as a texture, repeat 24
          times a second. It works. But every frame makes a round trip the GPU didn&apos;t need: the decoder (often the
          GPU&apos;s own video hardware) produces pixels in GPU memory, the program copies them down to system memory, and
          then uploads them straight back up so the renderer can use them.
        </p>
        <p>
          This post is about building the other version, where that round trip doesn&apos;t exist. NVIDIA&apos;s hardware
          decoder writes each frame into GPU memory, a CUDA kernel converts it into an RGBA texture that lives in Direct3D
          12, and <a href="https://wgpu.rs" {...ext}>wgpu</a>, Rust&apos;s graphics API, samples that same texture. The
          decoded pixels never leave the GPU.
        </p>
        <p>
          The rotating cube above is where it ends up: a Windows program, about 1,100 lines of Rust, C++ and CUDA, playing
          an MP4 on all six faces. The cube itself is ordinary wgpu, and you could replace it with anything. The work, and
          this post, is about getting the frames there. I&apos;ll go through it in the order I built it, explaining at each
          step what I needed, why I did it this way, and what the code is doing.
        </p>

        <h2 id="tldr">The short version</h2>
        <ul>
          <li><strong>Media Foundation reads the MP4, NVDEC decodes it.</strong>{" "}Windows&apos; built-in Source Reader hands
            over the compressed H.264 or HEVC packets as they are in the file, and NVIDIA&apos;s Video Codec SDK decodes
            them on the GPU&apos;s dedicated video engine. No FFmpeg.</li>
          <li><strong>CUDA converts NV12 to RGBA in place.</strong>{" "}The decoder outputs a YUV layout called NV12, which a
            shader can&apos;t sample directly. A small CUDA kernel converts it, writing straight into a D3D12 texture that
            CUDA has imported as external memory.</li>
          <li><strong>wgpu-hal wraps that texture.</strong> Two unsafe calls, <code>texture_from_raw</code> and{" "}
            <code>create_texture_from_hal</code>, turn the existing <code>ID3D12Resource</code> into an ordinary{" "}
            <code>wgpu::Texture</code> that you can bind and sample in WGSL like any other.</li>
          <li><strong>It&apos;s a working example, not a player.</strong>{" "}Synchronization is a blocking wait each frame,
            there&apos;s no audio, and it&apos;s Windows, D3D12 and NVIDIA only.</li>
        </ul>

        <h2 id="pipeline">Part 1: The plan, and why it takes five technologies</h2>
        <p>
          Before any code, here&apos;s the shape of the thing. The problem splits into stages, and each stage turned out to
          need a different piece of technology, because no single API does the whole job. That&apos;s the main reason this
          program looks complicated: it isn&apos;t that any one part is hard, it&apos;s that five parts have to agree with
          each other.
        </p>
        <ChartFigure title="From MP4 file to cube" subtitle="Only compressed bytes cross host memory." text={pipelineText}>
          <PipelineDiagram />
        </ChartFigure>
        <p>Reading the diagram top to bottom, this is what has to happen to show one frame:</p>
        <ol>
          <li><strong>Get the compressed video out of the file.</strong> An MP4 is a container, not a video. Something has
            to find the video track inside it and hand over its packets. I use Windows Media Foundation for this.</li>
          <li><strong>Turn packets into pictures.</strong>{" "}That&apos;s the decoder&apos;s job. I use NVDEC, the video
            decoding engine on NVIDIA GPUs, through NVIDIA&apos;s Video Codec SDK. It leaves each decoded frame in GPU
            memory.</li>
          <li><strong>Convert the frame into something a shader can use.</strong> Decoders output YUV, not RGB. A CUDA kernel
            does the conversion, because the decoded frame is already visible to CUDA.</li>
          <li><strong>Put the result where wgpu can see it.</strong>{" "}This is the step that makes the whole thing work: the
            kernel writes into a Direct3D 12 texture that both CUDA and wgpu can use, so there&apos;s one allocation and no
            copy.</li>
          <li><strong>Draw it.</strong>{" "}wgpu samples the texture in a WGSL shader. From here on it&apos;s ordinary graphics
            code.</li>
        </ol>
        <p>
          Notice what this is and isn&apos;t. It&apos;s a <em>no-readback</em> pipeline: the GPU still does real work between
          decoder and screen (NVDEC writes NV12, the kernel writes RGBA, the renderer samples it), and the demuxing and
          parsing still run on the CPU. What it avoids is the trip through system memory, and with it the CPU copies and
          the PCIe transfers that would otherwise happen every frame.
        </p>
        <p>The rest of Part 1 explains each stage in a bit more depth, so the code in Parts 2 to 4 has somewhere to hang.</p>

        <h3 id="containers-and-codecs">MP4 is the box, H.264 is what&apos;s in it</h3>
        <p>
          An MP4 file is a <em>container</em>: it holds one or more tracks (video, audio, subtitles) plus the timing and the
          settings needed to play them. The video track is compressed with a <em>codec</em>, here H.264 or HEVC. A compressed
          frame isn&apos;t a picture. It&apos;s a list of instructions (predictions from other frames, motion vectors,
          transformed residuals) that a decoder turns back into pixels.
        </p>
        <p>
          So playing an MP4 takes two separate steps: <em>demuxing</em> (pulling the compressed video samples out of the
          container, with their timestamps) and <em>decoding</em>{" "}(turning those samples into images). NVDEC only does the
          second. It has never heard of MP4. That&apos;s why the first thing I need is a demuxer, and why Media Foundation
          is in the picture at all: it&apos;s already on every Windows machine, it reads MP4, and it can be told to hand over
          the packets <em>without</em> decoding them.
        </p>

        <h3 id="what-nvdec-does">What NVDEC does, and what it needs from me</h3>
        <p>
          NVDEC is the fixed-function video decoder on NVIDIA GPUs. NVIDIA&apos;s{" "}
          <a href={NVDEC_GUIDE} {...ext}>NVDEC programming guide</a>{" "}puts it plainly: &ldquo;NVDEC runs completely
          independently of compute/graphics engine.&rdquo; That&apos;s the appeal. Decoding doesn&apos;t take CUDA cores
          or shader time away from the renderer; it happens on separate silicon.
        </p>
        <p>
          The Video Codec SDK exposes it through an API called NVCUVID. The thing that confused me at first is that it
          isn&apos;t one call that takes packets and gives back pictures. It&apos;s two objects. A <em>parser</em> runs on
          the CPU and reads the compressed bytes to find where each picture starts and ends. A <em>decoder</em> runs on
          NVDEC and decodes one picture at a time. The parser drives the decoder through callbacks: you feed the parser,
          and it calls you back when it has something.
        </p>
        <ArticleTable caption="The NVDEC calls this program uses" columns={["Call", "What it does"]} rows={[
          [<code key="a">cuvidCreateVideoParser</code>, "Creates the parser for one codec, with your three callbacks."],
          [<code key="b">cuvidParseVideoData</code>, "Feeds the parser one packet of compressed bytes. The callbacks fire from inside this call."],
          [<code key="c">cuvidDecodePicture</code>, "Called from the decode callback: kicks off decoding of one picture on NVDEC."],
          [<code key="d">cuvidMapVideoFrame</code>, "Post-processes a decoded picture into an output surface and returns a CUDA pointer to it. Must be unmapped again."],
        ]} />
        <p>The three callbacks are the key to the whole decode section later, so here&apos;s what each is for:</p>
        <ul>
          <li>The <strong>sequence</strong>{" "}callback fires when the parser learns the stream&apos;s format: codec, size,
            chroma format, bit depth. That&apos;s the first moment you know enough to create the decoder, so that&apos;s
            where it gets created.</li>
          <li>The <strong>decode</strong> callback fires when a complete picture is ready to decode. You call{" "}
            <code>cuvidDecodePicture</code> and NVDEC goes to work.</li>
          <li>The <strong>display</strong> callback fires when a picture is ready to be shown, <em>in display order</em>.
            That matters because codecs decode B-frames out of order: a frame that depends on a later frame is decoded
            after it but shown before it. The parser sorts that out and the display callback is where you get the
            sorted result.</li>
        </ul>

        <h3 id="nv12-and-cuda">NV12, and why CUDA converts it</h3>
        <p>
          Video is stored as luma (brightness) and chroma (color difference), not RGB, because the eye is less sensitive to
          color detail than to brightness, so codecs store color at lower resolution. NVDEC&apos;s output here is{" "}
          <strong>NV12</strong>: a full-resolution plane of 8-bit Y values, followed by a half-resolution plane of
          interleaved U and V pairs. Every 2×2 block of pixels shares one U and one V, so a frame takes 1.5 bytes per pixel
          instead of RGBA&apos;s 4.
        </p>
        <p>
          A fragment shader can&apos;t sample NV12 as if it were an RGBA texture, so something has to convert it, and I
          had two options. I could upload the Y and UV planes as two separate textures and do the math in the fragment
          shader. Or I could convert once, into RGBA, and keep the shader trivial. I chose the second, for a reason that
          only becomes clear once you see Step 6: the decoded frame comes back from NVDEC as a CUDA pointer. CUDA already
          has it. A CUDA kernel, one thread per pixel, is the shortest path from &ldquo;NV12 I can read&rdquo; to
          &ldquo;RGBA a shader can sample&rdquo;, and it keeps the WGSL to a single <code>textureSample</code>.
        </p>

        <h3 id="why-wgpu-hal">Why wgpu-hal: wgpu has to use memory it didn&apos;t allocate</h3>
        <p>
          Here&apos;s the crux of the whole project. wgpu normally owns every texture it uses: you call{" "}
          <code>device.create_texture(&amp;descriptor)</code>, wgpu allocates the memory, and wgpu tracks it from then on.
          In this program the texture has to already exist before wgpu sees it, because CUDA writes into it, and CUDA
          can&apos;t write into a texture wgpu allocated privately. I need a texture that was created <em>outside</em> wgpu,
          and then I need wgpu to adopt it.
        </p>
        <p>
          The high-level wgpu API can&apos;t take an existing D3D12 resource. <strong>wgpu-hal</strong>{" "}can. It&apos;s the
          layer underneath wgpu that implements each backend (D3D12, Vulkan, Metal), and wgpu exposes it through a few{" "}
          <code>unsafe</code> functions. <code>Device::as_hal</code>{" "}gives me the underlying D3D12 device, so I can create
          resources on it. wgpu-hal&apos;s <code>texture_from_raw</code> wraps a resource I hand it. And{" "}
          <code>Device::create_texture_from_hal</code>{" "}registers the wrapped resource with wgpu proper. After that it&apos;s
          an ordinary <code>wgpu::Texture</code>: views, bind groups and <code>textureSample</code> all work as usual.
        </p>
        <p>
          That&apos;s also why Direct3D 12 is involved at all, even though I never write a line of D3D12 rendering. wgpu&apos;s
          Windows backend is D3D12, and CUDA can import D3D12 resources as{" "}
          <a href={CUDA_INTEROP} {...ext}>external memory</a>. A D3D12 texture is the one kind of allocation both sides can
          use natively. So the plan is: create a D3D12 texture by hand, show it to CUDA, show the same one to wgpu.
        </p>

        <h3 id="why-a-native-bridge">Why a C++/CUDA bridge instead of pure Rust</h3>
        <p>
          Rust could call NVCUVID, CUDA and Media Foundation directly through FFI bindings, and for a library that&apos;s
          what I&apos;d do. For this project I put all three in one C++ file, <code>native/video_bridge.cu</code>, for two
          practical reasons. First, I need a CUDA kernel anyway, which means <code>nvcc</code> is already in the build.
          Second, these are C APIs with lots of structs, callbacks and COM pointers, and they read most naturally in C++.
          The Rust side then sees only seven small functions.
        </p>
        <ArticleTable caption="What the bridge wraps" columns={["Interface", "Why it's there"]} rows={[
          ["NVIDIA Video Codec SDK (NVCUVID)", "The parser and the NVDEC decoder"],
          ["CUDA (driver and runtime APIs)", "The context, the imported texture memory and the color kernel"],
          ["Media Foundation and Direct3D 12", "Reading MP4 packets, and creating the shared textures"],
        ]} />
        <p>
          The trade-off I&apos;m accepting is that all the unsafe interop lives in one file, behind a C ABI that hides Media
          Foundation and CUDA from Rust entirely. The Rust side can&apos;t misuse what it can&apos;t see.
        </p>

        <h2 id="setup">Part 2: Set up the project</h2>
        <p>
          <strong>Where we are:</strong>{" "}nothing is built yet. This part gets a Rust project that can compile a CUDA file
          and link against the NVIDIA SDK. It&apos;s mostly plumbing, but two of the problems I hit were here.
        </p>

        <h3 id="what-you-need">What you need</h3>
        <ul>
          <li><strong>Windows 11 x64 and an NVIDIA GPU with NVDEC</strong>, with a current driver. The driver provides{" "}
            <code>nvcuda.dll</code> and <code>nvcuvid.dll</code>, the only NVIDIA files the program loads at run time.</li>
          <li><strong>Rust stable with the MSVC toolchain</strong>, and Visual Studio 2022 Build Tools with the Windows SDK.
            They provide the C++ compiler <code>nvcc</code> uses underneath, and the D3D12 and Media Foundation headers.</li>
          <li><strong>The CUDA Toolkit</strong>, which provides <code>nvcc</code> and sets <code>CUDA_PATH</code>.</li>
          <li><strong>The <a href="https://developer.nvidia.com/video-codec-sdk" {...ext}>NVIDIA Video Codec SDK</a></strong>,
            downloaded and extracted. It has the NVCUVID headers and <code>nvcuvid.lib</code>. NVIDIA doesn&apos;t let you
            redistribute it, so every reader has to fetch it themselves.</li>
          <li><strong>An MP4 with progressive 8-bit 4:2:0 H.264 or HEVC</strong>, which is most of them.</li>
        </ul>
        <p>What I built and tested with:</p>
        <ArticleTable caption="Test setup" columns={["Item", "Version"]} rows={[
          ["GPU", "NVIDIA GeForce RTX 5080 Laptop GPU, Windows 11"],
          ["Rust / wgpu", "cargo 1.97.1, wgpu 30.0.1"],
          ["CUDA Toolkit", "13.2"],
          ["Video Codec SDK", "13.1.15"],
          ["Test clip", "Big Buck Bunny, 320×180 H.264 (CC BY 3.0, Blender Foundation)"],
        ]} />

        <h3 id="the-project">The project</h3>
        <p>
          Seven files. If you only read two, read <code>native/video_bridge.cu</code> (everything that talks to Media
          Foundation, NVDEC and CUDA) and <code>src/video.rs</code> (the Rust side of the bridge and the wgpu-hal import).
          The rest is setup and a standard wgpu cube that could be any mesh, a fullscreen quad or a material in an engine.
        </p>
        <FileTree title="nvdec-wgpu-cube" nodes={[
          { name: "Cargo.toml", href: "#dependencies", note: "wgpu 30.0.1 with only the DX12 backend" },
          { name: "build.rs", href: "#build-script", note: "compiles the CUDA bridge with nvcc and links the SDKs" },
          { name: "native", children: [
            { name: "video_bridge.cu", href: "#read-packets", note: "Media Foundation, NVDEC, CUDA and the shared textures" },
            { name: "bitstream.h", href: "#read-packets", note: "MP4 length prefixes to Annex B" },
            { name: "tests", children: [
              { name: "bitstream_test.cpp", note: "portable tests for bitstream.h" },
            ] },
          ] },
          { name: "src", children: [
            { name: "main.rs", href: "#sample-in-wgsl", note: "the wgpu device, bind groups and the cube" },
            { name: "video.rs", href: "#import-with-wgpu-hal", note: "the FFI, the wgpu-hal import and frame timing" },
            { name: "cube.wgsl", href: "#sample-in-wgsl", note: "vertex and fragment shaders" },
          ] },
        ]} />

        <h3 id="dependencies">Step 1: Dependencies</h3>
        <p>
          The manifest is short, but two choices in it are deliberate.
        </p>
        <Source excerpt={src.cargoToml} language="toml" />
        <p>
          <strong>wgpu is pinned to an exact version</strong>, <code>=30.0.1</code>, not <code>30</code>. The wgpu-hal
          calls I make in Step 9 are the kind of thing that changes signature between releases (the number of arguments
          to <code>texture_from_raw</code> is different in older versions, for example). A pinned version means the code in
          this post compiles against what it was written for, and a deliberate upgrade means revisiting that one file.
        </p>
        <p>
          <strong>Default features are off</strong>, and only <code>dx12</code> and <code>wgsl</code>{" "}are turned back on.
          This isn&apos;t about binary size. The whole design depends on wgpu using D3D12, so I don&apos;t want a Vulkan
          backend even available to be picked by accident. <code>std</code> and <code>parking_lot</code> are just what
          wgpu needs to function at all.
        </p>
        <p>
          Of the rest: <code>windows</code> gives me the <code>ID3D12Resource</code> type, which I need to hold the native
          texture pointer in Rust. <code>cc</code> is the build dependency that will drive <code>nvcc</code>. The others
          (<code>winit</code>, <code>glam</code>, <code>bytemuck</code>, <code>pollster</code>) are the usual wgpu
          companions for a window, matrices, vertex bytes and blocking on async setup.
        </p>

        <h3 id="build-script">Step 2: Compile CUDA from build.rs</h3>
        <p>
          Cargo doesn&apos;t know how to compile a <code>.cu</code> file, so a build script has to do it. The{" "}
          <code>cc</code> crate has a CUDA mode that runs <code>nvcc</code> and packages the result as a static library
          Cargo can link. The script also has to tell the linker about every native library the bridge uses.
        </p>
        <Source excerpt={src.buildRs} language="rust" />
        <p>Walking through it:</p>
        <ul>
          <li><strong>Lines 4–15 fail early.</strong>{" "}If this isn&apos;t Windows, or <code>CUDA_PATH</code> or{" "}
            <code>VIDEO_CODEC_SDK_DIR</code> is unset, or the SDK folder is missing its headers or library, the build stops
            with a message that says what to fix. Without these checks you get a wall of linker errors instead.</li>
          <li><strong>Lines 17–20 tell Cargo when to rerun.</strong> By default a build script reruns whenever anything in
            the package changes. Listing the two native files and the two environment variables means editing{" "}
            <code>main.rs</code>{" "}doesn&apos;t recompile the CUDA.</li>
          <li><strong>Lines 25–32 run nvcc</strong>{" "}on the bridge with the SDK&apos;s and CUDA&apos;s include folders, and
            compile it into <code>video_bridge.lib</code>.</li>
          <li><strong>Lines 33–37 link the native libraries</strong>: <code>nvcuvid</code> for the decoder API,{" "}
            <code>cuda</code> for the CUDA driver API, <code>d3d12</code> and <code>dxgi</code>, and the three Media
            Foundation libraries plus <code>ole32</code> for COM.</li>
        </ul>
        <p>
          Two lines took real digging, and they&apos;re both about the same problem: ending up with two C runtimes in one
          executable. Rust links against the DLL version of the Microsoft C runtime. Some of NVIDIA&apos;s libraries are
          built against the <em>static</em>{" "}version. Link both and you get warning LNK4098, and a program that may or may
          not work depending on which runtime&apos;s <code>malloc</code> a given pointer came from.
        </p>
        <ul>
          <li><strong><code>.cudart(&quot;shared&quot;)</code> on line 27.</strong> In CUDA mode, <code>cc</code> quietly
            links <code>cudart_static.lib</code> by default, the static-runtime build. Asking for <code>&quot;shared&quot;</code>{" "}
            links <code>cudart.lib</code> instead, which matches Rust.</li>
          <li><strong><code>/NODEFAULTLIB:LIBCMT</code> on line 42.</strong> In CUDA 13, <code>cuda.lib</code>{" "}isn&apos;t
            an import library but a small static loader for the driver, also built against the static runtime. This flag
            tells the linker to ignore its request for <code>LIBCMT</code> and bind it to the same runtime as everything
            else.</li>
        </ul>
        <p>
          A side effect worth knowing: both <code>cuda.lib</code> and <code>cudart.lib</code>{" "}load the driver&apos;s{" "}
          <code>nvcuda.dll</code> at run time, so the finished executable needs the NVIDIA driver but no CUDA Toolkit DLLs.
          You can copy it to another machine with the same driver and it runs.
        </p>

        <h2 id="decoding">Part 3: Decode on the GPU</h2>
        <p>
          <strong>Where we are:</strong> the project builds. Now I need the bridge to open a file and produce decoded frames
          in GPU memory. All of Part 3 is <code>native/video_bridge.cu</code>, in the order the bridge does things at
          startup: open the file, find the GPU, set up the decoder, then the per-frame loop, then the textures the frames
          go into. The bridge is one C++ object, <code>Bridge</code>, that owns everything.
        </p>

        <h3 id="read-packets">Step 3: Read compressed packets</h3>
        <p>
          The goal of this step: get a stream of compressed packets, each with a timestamp, out of an MP4 file, and get
          them in a form NVIDIA&apos;s parser accepts. Media Foundation&apos;s{" "}
          <a href={SOURCE_READER} {...ext}>Source Reader</a> is the API for reading samples from a media file, and the
          important thing about it is that it can either decode for you or hand over the stream as it is in the file.
        </p>
        <p>First, the boilerplate: COM and Media Foundation have to be started, and the file opened.</p>
        <Source excerpt={src.startMf} language="cpp" />
        <p>
          Line 141 is a wrinkle of running inside a windowed Rust program. COM has threading modes, and winit has usually
          already initialized COM on the UI thread in &ldquo;single-threaded apartment&rdquo; mode. Asking for
          multithreaded mode then fails with <code>RPC_E_CHANGED_MODE</code>, which isn&apos;t really an error, just COM
          saying the thread is already set up differently. So the bridge accepts whichever mode the thread has.
        </p>
        <p>Now the part that matters: configuring the reader so it does <em>not</em> decode.</p>
        <Source excerpt={src.openReader} language="cpp" />
        <p>Three things happen here, and the order matters:</p>
        <ol>
          <li><strong>Lines 152–155: select only the video stream.</strong> The reader starts with every stream selected.
            I deselect all of them and reselect the first video stream, so <code>ReadSample</code> never hands me an audio
            packet.</li>
          <li><strong>Lines 156–162: find out what codec it is.</strong>{" "}The stream&apos;s <em>native</em>{" "}media type is
            the type it has in the file, before any decoding. Its subtype GUID tells me whether it&apos;s H.264 or HEVC,
            which I&apos;ll need to create the right parser. Anything else is rejected, since NVDEC would need different
            handling for it.</li>
          <li><strong>Lines 163–164: set that native type as the output type.</strong>{" "}This is the line that makes Media
            Foundation a demuxer instead of a decoder. If I asked for an RGB or NV12 output type instead, the reader would
            insert its own software or hardware decoder, and I&apos;d be back to copying pixels around.</li>
        </ol>
        <p>Two more pieces of information come from the media type: the frame size, and the codec&apos;s parameter sets.</p>
        <Source excerpt={src.sequenceHeader} language="cpp" />
        <p>
          The frame size is needed to create the textures in Step 7, before any frame is decoded. The sequence header is
          something I didn&apos;t know I needed until the parser refused to produce frames without it. H.264 and HEVC
          streams start with parameter sets (the SPS and PPS; HEVC adds a VPS) that describe how the rest of the stream is
          coded. In an MP4, they&apos;re stored in the track&apos;s header rather than in the first packet. Media Foundation
          exposes them as <code>MF_MT_MPEG_SEQUENCE_HEADER</code>, and I feed them to the parser before any packet, in
          Step 5. Line 177 checks that they&apos;re in Annex B form, which brings me to the wrinkle.
        </p>
        <p>
          <strong>NAL units and how they&apos;re separated.</strong> An H.264 or HEVC stream is a sequence of NAL units
          (a header byte or two, then a slice of a picture or a parameter set). There are two ways to mark where one ends
          and the next begins. A raw stream uses <em>Annex B</em> framing: each NAL unit starts with a start code,{" "}
          <code>00 00 01</code> or <code>00 00 00 01</code>. Inside an MP4, NAL units are usually <em>length-prefixed</em>{" "}
          instead: four bytes giving the size, then the data. NVIDIA&apos;s own samples demux with FFmpeg and run its{" "}
          <code>mp4toannexb</code>{" "}filter before parsing, which converts the second form into the first. Media
          Foundation&apos;s MP4 source happened to deliver Annex B for my test clips, but I didn&apos;t want to depend on
          that, so the bridge accepts both and converts if needed. That logic is in <code>native/bitstream.h</code>:
        </p>
        <Source excerpt={src.framing} language="cpp" />
        <p>
          My first version of this was wrong in a way that&apos;s instructive. It checked whether the sample started with a
          start code and, if so, passed it through unchanged. The trouble is that a 4-byte length of 300 is{" "}
          <code>00 00 01 2C</code>, which looks exactly like a start code followed by a byte. So any length-prefixed sample
          whose first NAL unit was 256–511 bytes long (or exactly 1 byte, <code>00 00 00 01</code>) was sent to the decoder
          with its length prefixes still in it. The fix is to make the length-prefixed test the strict one and try it first:
          the lengths must cover the sample exactly, every NAL unit must be non-empty, and every NAL header&apos;s top bit
          (the <em>forbidden zero bit</em>, which the standards require to be 0) must be clear. Real Annex B data practically
          never passes that test by accident. And once the first sample has decided the framing, every later sample has to
          match it.
        </p>
        <p>With that in place, reading one packet looks like this:</p>
        <Source excerpt={src.readPacket} language="cpp" />
        <p>
          <code>ReadSample</code>{" "}is synchronous: it returns the next sample of the video stream, or a flag. The flags on
          lines 376–379 cover the cases that aren&apos;t a packet: the stream changed format mid-file (rejected; handling
          it would mean recreating the decoder), the end of the stream (remembered as <code>has_eos</code>; Step 6 uses
          it), or a gap with no sample. A real sample comes with a timestamp in 100-nanosecond units, which I keep because
          NVDEC&apos;s packet timestamps use the same unit, and it comes as a buffer I have to lock to read.
        </p>
        <Source excerpt={src.normalizePacket} language="cpp" />
        <p>
          Lines 387–398 run the framing logic from above and, the first time, print which form the file uses. Lines 400–406
          build the NVDEC packet and feed it to the parser: the (possibly converted) bytes, the timestamp, and a flag saying
          the timestamp is valid. The <code>push()</code> and <code>pop()</code> around <code>cuvidParseVideoData</code> are
          about CUDA contexts, which Step 4 explains. The point of this function is that by the time it returns, the parser
          has seen one more packet, and may have fired any of its three callbacks along the way.
        </p>
        <p>
          <code>bitstream.h</code> has no Windows or CUDA dependencies, which is deliberate: it means the framing logic can
          be unit-tested on any machine, including the two cases that used to be misread. The test is a plain C++ file:
        </p>
        <CodeBlock kind="command" language="bash"
          code={"clang++ -std=c++17 -Wall -Wextra -pedantic native/tests/bitstream_test.cpp -o bitstream_test\n./bitstream_test"} />

        <h3 id="pick-the-gpu">Step 4: Make CUDA use the GPU wgpu uses</h3>
        <p>
          This step exists because of laptops. Mine has an Intel iGPU next to the RTX, and CUDA and wgpu each pick a device
          on their own. If wgpu renders on one GPU and CUDA writes textures on another, the shared texture in Step 7 means
          nothing: memory on one GPU isn&apos;t visible to the other. So before creating anything, the bridge has to find
          the CUDA device that <em>is</em> the GPU wgpu chose.
        </p>
        <p>
          The Rust side does half of this. In <code>main.rs</code>{" "}I ask wgpu for a high-performance adapter and refuse
          anything that isn&apos;t NVIDIA:
        </p>
        <Source excerpt={src.adapter} language="rust" />
        <p>
          That guarantees wgpu is on an NVIDIA GPU. The bridge then has to find the matching CUDA device. The thing that
          links them is the <strong>LUID</strong>, a locally unique ID that Windows assigns to each graphics adapter. D3D12
          can report the LUID of the adapter a device was created on, and CUDA can report the LUID of each device it sees.
          Match them, and you have the same physical GPU on both sides:
        </p>
        <Source excerpt={src.luid} language="cpp" />
        <p>
          Lines 192–205 are the search: ask the D3D12 device for its adapter LUID, then walk CUDA&apos;s device list
          comparing LUIDs byte for byte. Line 206 creates a CUDA <em>context</em>{" "}on the match. A context is CUDA&apos;s
          per-device state, and every CUDA call acts on whichever context is &ldquo;current&rdquo; on the calling thread.
        </p>
        <p>
          Lines 212–214 are a small discipline I adopted after getting bitten. <code>cuCtxCreate</code> makes the new
          context current on the thread, implicitly. I pop it straight back off, and from then on every function that does
          CUDA work pushes the context first and pops it after (<code>push()</code> and <code>pop()</code> are one-line
          helpers on the bridge). That way nothing depends on which context happens to be current on the thread, which
          matters because winit, wgpu and the decoder callbacks all share that thread.
        </p>

        <h3 id="parser-and-decoder">Step 5: The parser and the decoder</h3>
        <p>
          Now the NVDEC objects. Recall the shape from Part 1: a parser that runs on the CPU and a decoder that runs on the
          hardware, with the parser driving the decoder through callbacks. The order of creation is forced on me. The parser
          can be created up front, because all it needs is the codec. The decoder can&apos;t, because its settings (picture
          size, how many surfaces to allocate) depend on the stream, and the parser only learns those from the sequence
          header. So: create the parser, feed it the sequence header, and create the decoder from inside the sequence
          callback.
        </p>
        <Source excerpt={src.createParser} language="cpp" />
        <p>
          Lines 326–328 tear down any existing parser and decoder first, because this function is also what the bridge
          calls when the clip loops (Step 6). Lines 329–337 create the parser. The three callbacks and{" "}
          <code>pUserData</code> are how C APIs do methods: the parser calls a plain function and passes back whatever
          pointer I gave it, which is the <code>Bridge</code> itself. <code>ulMaxDisplayDelay</code>{" "}is the guide&apos;s
          &ldquo;max display callback delay&rdquo;: how many decoded frames the parser may hold before handing one to the
          display callback (0 means none). The reordering of B-frames is the parser&apos;s job either way. Lines 338–343 feed
          the sequence header from Step 3, which is what triggers the sequence callback for the first time.
        </p>
        <p>The callbacks themselves are static functions that forward to the bridge:</p>
        <Source excerpt={src.callbacks} language="cpp" />
        <p>
          The decode callback (lines 267–270) is one line of work: hand the picture to <code>cuvidDecodePicture</code>. The
          display callback (lines 271–277) doesn&apos;t display anything. It just appends the frame&apos;s info to a queue,{" "}
          <code>decoded</code>, in display order. The per-frame loop in Step 6 drains that queue. Keeping the callback this
          small is deliberate: it runs from inside <code>cuvidParseVideoData</code>, and I don&apos;t want to map frames or
          run kernels from there.
        </p>
        <p>The sequence callback is the one with real decisions in it. First, what the bridge refuses to handle:</p>
        <Source excerpt={src.formatChecks} language="cpp" />
        <p>
          Lines 279–282 limit the program to progressive 8-bit 4:2:0 video. That isn&apos;t an NVDEC limit; it&apos;s mine.
          The color kernel in Step 7 assumes NV12, and 10-bit video (P010) or 4:2:2 would need a different output format
          and a different kernel. Rejecting them with a clear message beats producing garbage. Lines 283–291 handle the
          case where the sequence callback fires again mid-stream: if the size changed, I give up (handling it would mean
          recreating the decoder and the textures), and otherwise I just return the surface count.
        </p>
        <Source excerpt={src.createDecoder} language="cpp" />
        <p>
          Lines 292–298 ask the driver whether this GPU&apos;s NVDEC can decode this codec at this chroma format and bit
          depth. Older GPUs lack HEVC, for example, and it&apos;s better to learn that here than from a cryptic failure
          later. Lines 301–322 fill in the decoder settings. A few of them are worth understanding:
        </p>
        <ul>
          <li><strong><code>OutputFormat = NV12</code></strong> is the format <code>cuvidMapVideoFrame</code> will produce,
            which is what the kernel expects.</li>
          <li><strong><code>ulNumDecodeSurfaces</code></strong> is how many pictures NVDEC can have in flight. Codecs
            reference earlier frames, so the decoder has to keep several around. <code>min_num_decode_surfaces</code>{" "}is
            the stream&apos;s own minimum, and NVIDIA&apos;s guide recommends using it to keep memory use down. Returning
            that count from the callback (line 323) tells the parser to use it too.</li>
          <li><strong><code>ulNumOutputSurfaces = 2</code></strong> is a separate pool: the surfaces that mapped frames go
            into. Two is enough here because I map one frame at a time (Step 6).</li>
          <li><strong>The two sizes.</strong> <code>ulWidth</code> and <code>ulHeight</code> are the <em>coded</em> size,
            which can be larger than the picture because codecs store frames in whole blocks (16×16 macroblocks in H.264)
            and crop the rest. <code>display_area</code> and <code>ulTargetWidth</code>/<code>ulTargetHeight</code>{" "}describe
            the picture I actually want, and NVDEC applies them in its post-processing when a frame is mapped. That&apos;s
            why the textures in Step 7 can be exactly the video&apos;s size.</li>
        </ul>

        <h3 id="map-a-frame">Step 6: The per-frame loop: feed, decode, map</h3>
        <p>
          Everything so far was setup. This step is what runs every frame. The bridge exposes it to Rust as{" "}
          <code>nv_next</code>, and the contract is simple: &ldquo;give me the next frame in display order, converted and
          sitting in one of the textures, and tell me which texture and what time it&apos;s due.&rdquo; Internally it has
          two halves. The first feeds the parser until a frame is available:
        </p>
        <Source excerpt={src.feedLoop} language="cpp" />
        <p>
          The loop on lines 415–430 runs until the display queue from Step 5 has something in it. Each iteration does one of
          three things, depending on where in the file we are:
        </p>
        <ol>
          <li><strong>Normally, read one more packet</strong> (line 418). That may or may not produce a frame: with
            B-frames, the parser often needs several packets before it can release one in display order, which is exactly
            why this is a loop and not a single read.</li>
          <li><strong>At the end of the file, flush.</strong>{" "}When Media Foundation reported end-of-stream, the parser may
            still be holding frames it hasn&apos;t released. Sending a packet with the <code>ENDOFSTREAM</code> flag (lines
            420–426) tells it no more data is coming, so it releases them all.</li>
          <li><strong>Once those are drained, rewind.</strong> <code>rewind_video</code> seeks Media Foundation back to
            time zero and recreates the parser and decoder through <code>create_parser</code>. That&apos;s what makes the
            clip loop. The parser is only recreated after every frame it held has been consumed, because those frames
            live in its decoder&apos;s surfaces.</li>
        </ol>
        <p>
          Line 416 is a safety valve: a file with no decodable video would otherwise spin here forever.
        </p>
        <p>The second half takes the frame at the front of the queue and maps it:</p>
        <Source excerpt={src.mapFrame} language="cpp" />
        <p>
          Line 433 picks which of the three textures this frame will go into: the slot after the current one, wrapping
          around. Lines 435–443 map the frame. <code>cuvidMapVideoFrame</code>{" "}is where NVDEC&apos;s post-processing runs:
          it takes the decoded picture (identified by <code>picture_index</code>), converts it to the NV12 output format,
          applies the cropping from Step 5, and hands back two things: a CUDA device pointer to the result, and its row{" "}
          <em>pitch</em>. The pitch is the number of bytes from one row to the next, which is usually wider than the image
          because of alignment, so the kernel can&apos;t assume rows are packed.
        </p>
        <p>
          What I&apos;m holding now is the thing the whole project revolves around: a pointer to a decoded frame, in GPU
          memory, that CUDA can read. The next excerpt converts it.
        </p>
        <Source excerpt={src.convertFrame} language="cpp" />
        <p>
          Lines 445–448 launch the kernel: one thread per pixel, in 16×16 blocks, reading the NV12 frame and writing RGBA
          into the chosen slot&apos;s surface (the kernel and the surface are Step 7). Lines 449–450 wait for it to finish.
          Then line 452 unmaps the frame, and the order here is a rule, not a preference. The mapped surface is borrowed
          from the decoder&apos;s output pool. NVIDIA&apos;s guide says at most <code>ulNumOutputSurfaces</code> frames can
          be mapped at once, and that <code>cuvidUnmapVideoFrame</code>{" "}&ldquo;must be called to make the output surface
          available&rdquo; again. If I unmapped before the kernel finished reading, the decoder could reuse that surface
          while the kernel was still reading it. The <code>cudaDeviceSynchronize</code>{" "}on line 450 is what makes the unmap
          safe. (It&apos;s also a blocking wait, which Step 11 comes back to.)
        </p>
        <p>
          Lines 457–462 record the result: which slot has the frame, and its timestamp made relative to the first frame,
          so playback starts at zero no matter what the file&apos;s first timestamp is.
        </p>

        <h3 id="shared-textures">Step 7: Three textures that CUDA writes and wgpu reads</h3>
        <p>
          The kernel in Step 6 wrote into &ldquo;the chosen slot&apos;s surface&rdquo;. This step is where those surfaces
          come from, and it&apos;s the step the whole design hinges on. I need a texture that two different APIs can use.
          CUDA has to be able to write it, as a <em>surface object</em>{" "}(CUDA&apos;s name for a writable texture). wgpu has
          to be able to sample it. And there must be one allocation, not two with a copy between them.
        </p>
        <ChartFigure title="One texture, two users" subtitle="Each of the three slots is a single allocation that CUDA writes and wgpu samples." text={sharedText}>
          <SharedTextureDiagram />
        </ChartFigure>
        <p>
          The plan from Part 1 was: create the texture in D3D12, because that&apos;s the one place both sides can reach.
          The bridge creates it on wgpu&apos;s own D3D12 device, which the Rust side hands over in Step 9. Here&apos;s the
          creation, which runs once for each of the three slots:
        </p>
        <Source excerpt={src.createResource} language="cpp" />
        <p>Three settings on the resource make the sharing possible:</p>
        <ul>
          <li><strong><code>D3D12_HEAP_FLAG_SHARED</code> (line 229).</strong>{" "}Without this, the allocation is private to
            the D3D12 device and can&apos;t be opened by anything else.</li>
          <li><strong><code>ALLOW_SIMULTANEOUS_ACCESS</code> (line 228).</strong>{" "}D3D12 normally requires explicit
            &ldquo;resource state&rdquo; transitions when a texture changes use (written by one thing, then read by
            another). This flag opts the texture out of that system, so CUDA and wgpu can both touch it without either
            knowing the other&apos;s state. Step 9 relies on this.</li>
          <li><strong><code>R8G8B8A8_UNORM</code> (line 225).</strong>{" "}This has to match on all three sides: it&apos;s what
            the kernel writes (<code>uchar4</code>), what CUDA&apos;s array format describes (line 245), and what wgpu is
            told in Step 9 (<code>Rgba8Unorm</code>).</li>
        </ul>
        <p>
          Lines 232–234 then ask D3D12 for an NT handle to the resource. That&apos;s the only way CUDA can open a D3D12
          resource: through a handle, not a pointer. (wgpu won&apos;t need the handle, because it&apos;s on the same device
          and can use the resource pointer directly.) The import into CUDA follows:
        </p>
        <Source excerpt={src.importToCuda} language="cpp" />
        <p>This is three CUDA objects stacked on top of each other, and each exists for a reason:</p>
        <ol>
          <li><strong>External memory (lines 235–242).</strong> <code>cudaImportExternalMemory</code>{" "}takes the handle and
            the allocation&apos;s size (asked from D3D12, since a texture&apos;s allocation is bigger than width × height ×
            4) and gives CUDA a reference to the same GPU memory. The handle can be closed as soon as the import succeeds;
            CUDA keeps its own reference.</li>
          <li><strong>A mipmapped array over it (lines 243–253).</strong>{" "}External memory is just bytes to CUDA. To treat
            it as a 2D image with a known format, I map a CUDA array over it, describing the format (four 8-bit unsigned
            channels), the size, and that it will be written through a surface. One mip level, since it&apos;s a video
            frame.</li>
          <li><strong>A surface object (lines 254–258).</strong> This is the handle the kernel actually writes through,
            with <code>surf2Dwrite</code>. It&apos;s what gets passed to the kernel launch in Step 6.</li>
        </ol>
        <p>And the kernel that writes into it:</p>
        <Source excerpt={src.kernel} language="cpp" />
        <p>
          Each thread handles one pixel (lines 39–41). It reads its Y value from the first plane, then finds the U/V pair
          its 2×2 block shares in the second plane (line 45: halve both coordinates, and the pairs are interleaved, so
          multiply x by 2). Then it applies the BT.709 limited-range conversion. &ldquo;Limited range&rdquo; means the
          codec stores black as 16 and white as 235, not 0 and 255, which is why the math starts with{" "}
          <code>1.164 × (Y − 16)</code>: that stretches 16–235 back out to 0–255. The constants on lines 50–52 are the
          standard&apos;s coefficients for how much V contributes to red, how much U and V subtract from green, and how much
          U contributes to blue. The result is clamped to 0–255 and written as one RGBA pixel.
        </p>
        <p>
          The kernel always assumes BT.709 limited range. That&apos;s right for HD video and for my clip, but a real player
          would read the stream&apos;s color metadata and pick the matrix accordingly. I come back to that in the
          limitations.
        </p>

        <h2 id="into-wgpu">Part 4: Hand the frames to wgpu</h2>
        <p>
          <strong>Where we are:</strong> the bridge can open a file and, on each call to <code>nv_next</code>, leave a
          converted RGBA frame in one of three D3D12 textures. None of that is visible to Rust yet. This part crosses the
          language boundary and then does the wgpu-hal import, which is the step that makes the textures usable by the
          renderer.
        </p>

        <h3 id="c-abi">Step 8: A small C ABI</h3>
        <p>
          I want the Rust side to know as little as possible about Media Foundation, NVDEC and CUDA. So the bridge exports
          seven plain C functions, and the <code>Bridge</code> object is an opaque pointer to Rust: it can hold it and pass
          it back, but not look inside.
        </p>
        <Source excerpt={src.cAbi} language="cpp" />
        <p>
          Most of these are thin. The two that carry the design are <code>nv_next</code>, which runs Step 6 and reports a
          slot and a timestamp, and <code>nv_texture</code>, which hands out the D3D12 resource for a slot. Line 477 is
          the subtle part of <code>nv_texture</code>: COM objects are reference-counted, and the bridge calls{" "}
          <code>AddRef</code> before returning the pointer. That gives the Rust side a reference of its own, so the resource
          stays alive even after the bridge releases its reference in <code>nv_close</code>. Step 9 takes ownership of that
          extra reference.
        </p>
        <p>On the Rust side, the declarations mirror the exports:</p>
        <Source excerpt={src.rustExtern} language="rust" />
        <p>
          <code>VideoHandle</code>{" "}on lines 10–11 is the Rust idiom for an opaque type: a struct with no fields that can only
          be used through a pointer. Nothing checks the two declaration lists against each other, so a change to one has
          to be made in both. That&apos;s the cost of the simplicity.
        </p>

        <h3 id="import-with-wgpu-hal">Step 9: Import the textures with wgpu-hal</h3>
        <p>
          This is the step the post is named for. <code>Video::open</code> in <code>src/video.rs</code>{" "}is where the Rust
          side and the bridge meet, and it does four things: get the raw D3D12 device out of wgpu, open the bridge on it,
          decode the first frames, and wrap each slot&apos;s resource as a <code>wgpu::Texture</code>.
        </p>
        <Source excerpt={src.openBridge} language="rust" />
        <p>
          Lines 55–56 are the first unsafe call, and the first place wgpu-hal appears. <code>as_hal</code>{" "}reaches under
          wgpu&apos;s abstraction and returns the backend-specific device, here <code>wgpu::hal::dx12::Device</code>. From
          that I can get the raw <code>ID3D12Device</code> pointer, which is what the bridge needs in Step 7 to create the
          textures on the <em>same</em>{" "}device wgpu renders with. If wgpu weren&apos;t using D3D12, <code>as_hal</code>{" "}
          returns <code>None</code>{" "}and the program stops here with a clear message. Line 58 opens the bridge, which runs
          all of Part 3&apos;s setup. Lines 66–67 decode two frames before wgpu wraps anything: the frame to show first, and
          one frame of lookahead (Step 11 explains why there&apos;s a lookahead).
        </p>
        <p>The closure starting on line 62 is for cleanup, and I&apos;ll come back to it. Inside it is the import:</p>
        <Source excerpt={src.wrapTextures} language="rust" />
        <p>For each of the three slots:</p>
        <ol>
          <li><strong>Lines 70–73: take ownership of the resource.</strong> <code>nv_texture</code> returns the raw pointer
            with an extra reference added (Step 8). <code>ID3D12Resource::from_raw</code> turns that pointer into a Rust
            value that will call <code>Release</code> when dropped, so the reference count is balanced.</li>
          <li><strong>Lines 74–83: describe the texture to wgpu.</strong> This descriptor has to match the resource the
            bridge created. The same format (<code>Rgba8Unorm</code> is <code>R8G8B8A8_UNORM</code>), the same size, one
            mip level, one sample. The usage is <code>TEXTURE_BINDING</code> only, because wgpu will only ever sample these;
            it never renders into them or copies from them.</li>
          <li><strong>Lines 84–93: wrap the resource in a wgpu-hal texture.</strong> <code>texture_from_raw</code>{" "}doesn&apos;t
            allocate anything. It just pairs the resource pointer with the metadata wgpu-hal needs to treat it as a texture.</li>
          <li><strong>Lines 94–95: register it with wgpu.</strong> <code>create_texture_from_hal</code> takes the hal
            texture and the descriptor and returns an ordinary <code>wgpu::Texture</code>. The third argument,{" "}
            <code>TextureUses::RESOURCE</code>, tells wgpu what state the texture is in right now; more on that below.</li>
        </ol>
        <p>
          Every <code>unsafe</code>{" "}in this excerpt is a promise the compiler can&apos;t check, and wgpu&apos;s{" "}
          <a href={WGPU_DEVICE} {...ext}>documentation for <code>create_texture_from_hal</code></a>{" "}spells out what I&apos;m
          promising:
        </p>
        <CodeBlock kind="output" label="wgpu 30.0.1, Device::create_texture_from_hal, Safety" code={`- \`hal_texture\` must be created from this device internal handle
- \`hal_texture\` must be created respecting \`desc\`
- \`hal_texture\` must be initialized
- \`initial_state\`, if it is not \`TextureUses::UNINITIALIZED\`, must
  match the actual driver-side layout/state of the wrapped resource at
  the moment of wrap.`} />
        <p>It&apos;s worth going through these one at a time, because each one was a decision somewhere earlier in the code:</p>
        <ArticleTable caption="The safety contract, point by point" columns={["Requirement", "How it holds here"]} rows={[
          ["Created from this device", <span key="a">Step 7 creates the resources on the <code>ID3D12Device</code> that <code>as_hal</code>{" "}returned on line 55, and Step 4 matched the CUDA device to that adapter&apos;s LUID. Same device, same GPU.</span>],
          ["Matches the descriptor", <span key="b">Format, size, mip count and sample count on lines 74–83 are copied from how Step 7 created the resource. If either side changed, this is the line to update.</span>],
          ["Initialized", <span key="c">Lines 66–67 decode into the first two slots before the import. The third slot is wrapped before its first write. That&apos;s harmless here, because wgpu only ever samples a slot the bridge has reported as containing a frame, but it&apos;s the one place this code leans on the contract rather than meeting it outright.</span>],
          ["Initial state matches", <span key="d">The resources were created in <code>COMMON</code>, and wgpu is told <code>RESOURCE</code>. That&apos;s consistent for simultaneous-access textures: they&apos;re &ldquo;implicitly promoted from D3D12_RESOURCE_STATE_COMMON to the relevant state on first GPU access&rdquo; and decay back after each submission (<a href={D3D12_STATES} {...ext}>Microsoft&apos;s resource state docs</a>). That&apos;s why the flag in Step 7 mattered.</span>],
        ]} />
        <p>The end of <code>open</code> is timing setup and the cleanup I promised to explain:</p>
        <Source excerpt={src.openEnd} language="rust" />
        <p>
          Lines 98–104 start the playback clock and work out when the lookahead frame is due. Line 106 is why the body was
          wrapped in a closure: if anything after <code>nv_open</code>{" "}fails (a slot&apos;s resource is missing, a decode
          errors), the closure returns early with the error, and this line still calls <code>nv_close</code>. Without it,
          a failed open would leak the decoder, the CUDA context and the textures.
        </p>
        <p>Ownership at the end of this step, because it&apos;s easy to lose track of:</p>
        <ul>
          <li>The bridge owns the decoder, the CUDA objects and <em>one</em> reference to each D3D12 resource.</li>
          <li>Each <code>wgpu::Texture</code> owns another reference to its resource, via <code>from_raw</code>.</li>
          <li><code>Video</code> owns the bridge pointer and the three textures. Its <code>Drop</code> closes the bridge:</li>
        </ul>
        <Source excerpt={src.drop} language="rust" />
        <p>
          The comment on lines 141–142 is the one rule the caller has to follow: the GPU must be idle before{" "}
          <code>Video</code> is dropped, because <code>nv_close</code> tears down the CUDA side while wgpu might still have
          a frame in flight that samples the texture. <code>main.rs</code> handles that by waiting for the device in its own{" "}
          <code>Drop</code>, which runs before <code>Video</code>&apos;s.
        </p>

        <h3 id="sample-in-wgsl">Step 10: Sample the video in WGSL</h3>
        <p>
          From here on it&apos;s ordinary wgpu, which is the point. The three textures came from a video decoder, but nothing
          in the rendering code knows that. Each slot gets its own bind group, sharing the same uniform buffer and sampler:
        </p>
        <Source excerpt={src.bindGroups} language="rust" />
        <p>
          Why one bind group per slot rather than one bind group I rebind? Because a bind group is immutable once created,
          and this way switching frames costs nothing: draw with whichever group matches the slot the bridge last reported.
        </p>
        <Source excerpt={src.setBindGroup} language="rust" />
        <p>And the shader has no idea any of this happened:</p>
        <Source excerpt={src.shader} language="wgsl" />
        <p>
          One thing in this step did go wrong, and it&apos;s worth telling because it&apos;s easy to repeat. My first version
          picked an sRGB swapchain format, which is the usual advice for wgpu programs, and the video came out pale and
          washed out:
        </p>
        <ArticleFigure media={COLOR_COMPARISON} />
        <p>
          The cause took a while to see. The kernel in Step 7 writes <em>display-encoded</em> RGB, the gamma-encoded values a
          video player would put on screen. It writes them into an <code>Rgba8Unorm</code> texture, and wgpu samples that
          format as-is, treating the values as linear. Then the sRGB swapchain gamma-encodes everything written to it. So the
          video was gamma-encoded twice, which pushes midtones toward white. The fix is to render to a non-sRGB swapchain
          format, so the values reach the screen unchanged, the way a video player would show them:
        </p>
        <Source excerpt={src.swapchain} language="rust" />
        <p>
          That has one knock-on effect. wgpu treats clear colors as linear only on sRGB targets, so the window&apos;s
          background color needs its own conversion to look the same on either kind of format:
        </p>
        <Source excerpt={src.background} language="rust" />
        <p>
          To check the fix was right rather than just different, I compared the cube&apos;s pixels against an independent
          decode: ffmpeg&apos;s frame from the same moment of the clip, converted with the same BT.709 limited-range matrix.
          The fixed version lands within a few levels of ffmpeg:
        </p>
        <ArticleTable caption="Average color of the cube's pixels, and of ffmpeg's frame" columns={["", "Average RGB", "Saturation", "Brightness"]} rows={[
          ["Before (sRGB swapchain)", "237, 231, 227", "0.08", "0.95"],
          ["After (Bgra8Unorm)", "220, 206, 198", "0.17", "0.90"],
          ["ffmpeg's decode", "217, 205, 197", "0.17", "0.88"],
        ]} />
        <p>The cube shows the frame in perspective, so this is an approximate check, but the difference is clear.</p>

        <h3 id="frame-timing">Step 11: Frame timing and synchronization</h3>
        <p>
          Two clocks are running. The cube redraws about every 16 ms, because that&apos;s a reasonable refresh rate for an
          animation. The video has its own rate, 24 frames per second for my clip, which is about every 42 ms. So on most
          redraws the video shouldn&apos;t change, and on some it should. <code>Video::update</code> runs on every redraw
          and decides:
        </p>
        <Source excerpt={src.update} language="rust" />
        <p>
          This is where the lookahead frame from Step 9 pays off. At any moment <code>Video</code> holds two frames: the one
          on screen (<code>current</code>) and the next one (<code>pending</code>), whose timestamp it already knows. Line
          114 is the whole scheduling decision: if the pending frame isn&apos;t due yet, do nothing. When it is due, lines
          120–121 promote it to current, and lines 125–134 decode a new pending frame and work out when <em>that</em>{" "}one is
          due. Knowing the next frame&apos;s time in advance is what lets this be a simple comparison instead of a guess.
        </p>
        <p>
          The timestamps make this possible by passing through every layer unchanged: Media Foundation&apos;s sample time
          became the NVDEC packet timestamp in Step 3, came back out with the decoded frame in Step 6, and the bridge made it
          relative to the first frame. Lines 121–124 handle the loop: a timestamp that goes backwards means the bridge
          rewound the clip, so the playback clock restarts. Lines 130–133 handle files with duplicate or missing timestamps
          by falling back to the last known frame interval.
        </p>
        <p>
          Then there&apos;s the part I&apos;ve been deferring: <strong>synchronization</strong>, lines 117–118. Here is the
          problem. The bridge decodes into slot <code>(current + 1) % 3</code>. With one slot on screen and one holding the
          lookahead, that&apos;s the slot that was on screen two frames ago. &ldquo;Was on screen&rdquo; is from the CPU&apos;s
          point of view; the GPU runs behind the CPU, and a draw call that samples that slot may not have executed yet. If
          CUDA writes into it now, that draw samples a half-written frame. Nothing in D3D12, CUDA or wgpu prevents this on
          its own, because none of them knows what the others are doing with the memory.
        </p>
        <p>
          The conservative answer, and the one this code uses, is to wait. Before every decode, line 117 waits until the GPU
          has finished everything wgpu submitted (<code>device.poll(Wait)</code>). And in Step 6, the bridge waits for the
          kernel to finish before returning (<code>cudaDeviceSynchronize</code>). Between the two waits, CUDA never writes a
          slot the GPU might be reading, and wgpu never samples a slot CUDA is still writing.
        </p>
        <p>
          That makes it correct, but not concurrent. Decode, conversion and rendering happen strictly one after another, and
          at 24 frames per second on a 320×180 clip nobody notices. At 4K it would. The three slots are there for the real
          fix: give each slot a D3D12 fence, import it into CUDA as an external semaphore, and have each side wait only for
          the slot it needs. Then decoding could move to its own thread, and three slots would become true triple buffering.
          I stopped short of that because it&apos;s a post of its own, and because the version with the waits is the one
          where every step is easy to follow.
        </p>

        <h2 id="run-it">Part 5: Build and run</h2>
        <p>
          <strong>Step 12.</strong> No developer prompt is needed; <code>cc</code> finds the Visual Studio compiler for{" "}
          <code>nvcc</code> on its own. The only thing to set is where the Video Codec SDK is. In PowerShell:
        </p>
        <CodeBlock kind="command" language="powershell" label="PowerShell" code={`$env:VIDEO_CODEC_SDK_DIR = "C:\\path\\to\\Video_Codec_SDK_13.1.15"
cargo run --release -- "C:\\Videos\\sample.mp4"`} />
        <p>A working start prints one line per stage, which is useful for seeing how far it got when something fails:</p>
        <CodeBlock kind="output" label="Output" code={`wgpu adapter: NVIDIA GeForce RTX 5080 Laptop GPU (Dx12)
[mf] compressed H.264 320x180, sequence headers=35 bytes
[mf] NAL framing: Annex B
Native Video Codec SDK: H.264/HEVC, Media Foundation compressed packets, 3 GPU textures
Swapchain format: Bgra8Unorm`} />
        <p>
          Then a window opens with the cube, playing the clip on every face. My test clip played for about 90 seconds per
          run without an error. The process peaked at about 330 MB and used about 17 seconds of CPU time over those 90
          seconds.
        </p>
        <p>
          That clip is Constrained Baseline H.264, which has no B-frames, so it never exercised the reordering I described
          in Step 5. To check that path, I cut a 4-second High-profile clip from it with ffmpeg (58 of its 96 frames are
          B-frames) and let it loop. It played through about four loops without errors, which also covers the end-of-stream
          flush and the rewind in Step 6. I didn&apos;t check the frame order frame by frame.
        </p>
        <p>
          The build also prints a few <code>Compiler family detection failed ... &quot;nvcc&quot; &quot;-E&quot;</code>{" "}
          warnings. That&apos;s <code>cc</code> probing <code>nvcc</code>{" "}to learn what kind of compiler it is, and it
          doesn&apos;t affect the build.
        </p>

        <h3 id="common-errors">Common errors</h3>
        <p>
          Build errors come from <code>build.rs</code>&apos;s checks in Step 2. At run time the bridge prints{" "}
          <code>[nvdec]</code> lines to stderr, and the same message ends the program.
        </p>
        <ArticleTable caption="Errors and what they mean" columns={["Message", "What to do"]} rows={[
          [<code key="a">Set VIDEO_CODEC_SDK_DIR to the extracted NVIDIA Video Codec SDK</code>, "Set the variable in the same terminal, pointing at the extracted folder."],
          [<code key="b">Could not locate SDK nvcuvid.lib (Lib/win/x64 or Lib/x64)</code>, "The path points at the wrong level (or at the zip). It should be the folder that contains Interface and Lib."],
          [<code key="c">Install the NVIDIA CUDA Toolkit (CUDA_PATH)</code>, "Install the CUDA Toolkit, then open a new terminal so CUDA_PATH is set."],
          [<code key="d">This sample requires wgpu to use an NVIDIA GPU (vendor 0x10DE)</code>, "wgpu picked another adapter, such as an iGPU (Step 4). Check which GPU Windows assigns to the program."],
          [<code key="e">CUDA device LUID doesn&apos;t match the wgpu D3D12 NVIDIA adapter</code>, "CUDA can't see the GPU wgpu chose (Step 4). Check the driver and that the CUDA Toolkit supports the GPU."],
          [<code key="f">Only native compressed H.264/HEVC MP4 is supported</code>, "The video uses another codec (AV1, VP9 and so on). Re-encode it, or extend the subtype check in Step 3."],
          [<code key="g">Only progressive 8-bit 4:2:0 video is supported (NV12)</code>, "10-bit, 4:2:2 or interlaced video, rejected in Step 5. See the limitations below."],
          [<code key="h">Codec/profile not supported by NVIDIA hardware</code>, "cuvidGetDecoderCaps says this GPU's NVDEC can't decode the stream's codec or profile."],
          [<code key="i">Invalid compressed NAL units (...)</code>, "The packets are neither Annex B nor 4-byte length-prefixed, or the framing changed mid-stream (Step 3)."],
        ]} />

        <h2 id="limitations">Limitations and next steps</h2>
        <p>
          This is a demonstration of the interop, not a video player, and I want to be clear about which is which. Here is
          what the example does and doesn&apos;t do:
        </p>
        <ArticleTable caption="What the example does and doesn't do" columns={["Feature", "Status"]} rows={[
          ["Hardware H.264 and HEVC decoding", "Yes, for progressive 8-bit 4:2:0"],
          ["Decoded frames stay in GPU memory", "Yes"],
          ["CUDA writing into shared D3D12 textures", "Yes"],
          ["Native textures imported into wgpu", "Yes, through wgpu-hal"],
          ["Video on 3D geometry", "Yes"],
          ["Audio", "No"],
          ["10-bit, HDR, P010", "No"],
          ["Color conversion from the stream's metadata", "No: BT.709 limited range is assumed"],
          ["Asynchronous CUDA and wgpu", "No: a blocking wait every frame"],
          ["Other platforms", "No: Windows, D3D12 and NVIDIA only"],
        ]} />
        <p>
          And to repeat the caveat from Part 1: the demuxing and the bitstream parsing run on the CPU. It&apos;s the decoding,
          the color conversion and the rendering that happen on the GPU.
        </p>

        <h3 id="color-accuracy">Color accuracy</h3>
        <p>
          The double-gamma bug in Step 10 is fixed, but the kernel still assumes BT.709 limited range for every file. SD video
          is usually BT.601, HDR is BT.2020 with a different transfer function, and some files are full range. My clip
          carries no color metadata at all, which is common, so a real player has to guess too, typically from the
          resolution. Doing this properly means reading the stream&apos;s color metadata (Media Foundation exposes it on the
          media type) and choosing the matrix in the kernel accordingly.
        </p>

        <h3 id="synchronization">Synchronization</h3>
        <p>
          The blocking waits in Step 11 are the biggest cost. The proper version imports a D3D12 fence per slot into CUDA as
          an external semaphore (the same <a href={CUDA_INTEROP} {...ext}>CUDA interop API</a> has{" "}
          <code>cudaImportExternalSemaphore</code>{" "}for this). CUDA signals the slot&apos;s fence after the kernel, the render
          queue waits on it before sampling, and CUDA waits on the render queue&apos;s fence before writing the slot again.
          With a decoder thread and a small frame queue, decode and rendering could overlap.
        </p>

        <h3 id="audio-and-timing">Audio and timing</h3>
        <p>
          There&apos;s no audio, so the video clock is the only clock. There&apos;s no frame dropping either: if a frame is
          late, it&apos;s shown late. Packet reading is synchronous on the UI thread, so a slow disk read would stall
          rendering too. A player would read on a worker thread and pace video against the audio clock.
        </p>

        <h3 id="formats">HDR and other formats</h3>
        <p>
          10-bit video (P010), 4:2:2, interlaced streams and mid-stream resolution changes are all rejected in Step 5. NVDEC
          can decode more than this, AV1 included on newer GPUs, but each one needs a different output format, a different
          kernel, or a decoder that can be recreated on the fly. HDR also needs tone mapping, which is a topic of its own.
        </p>

        <h2 id="wrapping-up">Wrapping up</h2>
        <p>
          Stepping back from the details, the useful result is small and reusable: <strong>an NVDEC-decoded frame as an
          ordinary, sampleable <code>wgpu::Texture</code></strong>, with no trip through system memory. The cube is just
          where I happened to show it. The same three textures could feed a fullscreen quad, a material in a game engine, a
          video wall, or a compute pass. And since the frames are already in CUDA when they&apos;re mapped, it&apos;s also a
          starting point for running CUDA processing on decoded video before it&apos;s drawn.
        </p>
        <p>
          If I had to name the three ideas that made it work: the LUID match in Step 4, so CUDA and wgpu are on one GPU; the
          shared, simultaneous-access texture in Step 7, so both can use one allocation; and wgpu-hal in Step 9, so wgpu can
          adopt memory it didn&apos;t allocate. Everything else is plumbing between those three. The parts that needed
          fixing were the less obvious ones: how NAL units are framed, two C runtimes in one binary, and gamma applied
          twice.
        </p>
        <Note>
          The examples in this post are verbatim excerpts of the project, with their real line numbers, as it was on
          October 24, 2026.
        </Note>

        <h2 id="glossary">Terms used in this post</h2>
        <dl>
          <dt><strong>NVDEC</strong></dt><dd>The hardware video decoder on NVIDIA GPUs, separate from the graphics and compute engines.</dd>
          <dt><strong>NVCUVID</strong></dt><dd>The Video Codec SDK&apos;s decoding API: the parser (<code>cuvidCreateVideoParser</code>) and the decoder (<code>cuvidCreateDecoder</code>).</dd>
          <dt><strong>Demuxing</strong></dt><dd>Pulling the compressed samples of one track out of a container such as MP4, with their timestamps.</dd>
          <dt><strong>NAL unit</strong></dt><dd>The basic unit of an H.264 or HEVC stream: a header byte (two in HEVC) followed by a slice of a picture or a parameter set such as the SPS or PPS.</dd>
          <dt><strong>Annex B</strong></dt><dd>The byte-stream format that separates NAL units with start codes (<code>00 00 01</code>). MP4 files usually store them with length prefixes instead.</dd>
          <dt><strong>NV12</strong></dt><dd>An 8-bit 4:2:0 YUV layout: a full-size Y plane, then a half-size plane of interleaved U and V.</dd>
          <dt><strong>PTS</strong></dt><dd>Presentation timestamp: when a frame should be shown. Media Foundation and NVDEC both use 100 ns units.</dd>
          <dt><strong>LUID</strong></dt><dd>The locally unique ID Windows assigns each graphics adapter. D3D12 and CUDA both report it, which is how the bridge matches them.</dd>
          <dt><strong>CUDA context</strong></dt><dd>CUDA&apos;s per-device state. Every CUDA call acts on the context that is current on the calling thread.</dd>
          <dt><strong>wgpu-hal</strong></dt><dd>The layer under wgpu that implements each backend. Its <code>unsafe</code> functions let you use native resources.</dd>
          <dt><strong>External memory</strong></dt><dd>CUDA&apos;s name for memory allocated by another API, such as a D3D12 resource, and imported through a handle.</dd>
          <dt><strong>Surface object</strong></dt><dd>CUDA&apos;s handle for writing to a texture-like array from a kernel.</dd>
          <dt><strong>Simultaneous access</strong></dt><dd>A D3D12 texture flag that lets more than one queue or API use a texture without layout transitions.</dd>
        </dl>

        <h2 id="references">References and updates</h2>
        <p><time dateTime="2026-10-24">October 24, 2026</time>: first version.</p>
        <ul>
          <li><a href={NVDEC_GUIDE} {...ext}>NVDEC Video Decoder API Programming Guide 13.1</a>: the parser, its callbacks, decoder creation, mapping and output surfaces.</li>
          <li><a href="https://developer.nvidia.com/video-codec-sdk" {...ext}>NVIDIA Video Codec SDK</a>: the headers and libraries the bridge builds against.</li>
          <li><a href={CUDA_INTEROP} {...ext}>CUDA external resource interoperability</a>: <code>cudaImportExternalMemory</code>, mapped arrays, and external semaphores.</li>
          <li><a href={SOURCE_READER} {...ext}>Media Foundation Source Reader</a>: reading samples, native compressed types and seeking.</li>
          <li><a href="https://learn.microsoft.com/en-us/windows/win32/direct3d12/shared-heaps" {...ext}>Direct3D 12 shared heaps</a>: sharing resources across APIs.</li>
          <li><a href={D3D12_STATES} {...ext}>Direct3D 12 resource states</a>: implicit promotion and decay for simultaneous-access textures.</li>
          <li><a href={WGPU_DEVICE} {...ext}>wgpu 30.0.1 <code>Device</code></a>: <code>as_hal</code> and <code>create_texture_from_hal</code>, with their safety requirements.</li>
          <li><a href="https://github.com/NVIDIA/video-sdk-samples" {...ext}>NVIDIA Video SDK samples</a>: NVIDIA&apos;s fuller decoder examples, which demux with FFmpeg.</li>
        </ul>
    </ArticleShell>
    </SiteLayout>
  );
}
