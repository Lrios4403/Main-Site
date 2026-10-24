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
          Playing a video inside a 3D scene usually goes like this: decode a frame, copy its pixels into CPU memory, and
          upload them to the GPU again as a texture, every frame. This post builds the other version. NVIDIA&apos;s hardware
          decoder writes each frame into GPU memory, a CUDA kernel turns it into RGBA inside a Direct3D 12 texture, and
          Rust&apos;s <a href="https://wgpu.rs" {...ext}>wgpu</a> samples that same texture. The decoded pixels never leave the
          GPU.
        </p>
        <p>
          The rotating cube above is the proof: a Windows program, about 1,100 lines of Rust, C++ and CUDA, playing an MP4
          on all six faces. The cube itself is ordinary wgpu. The interesting part is getting the frames there, so that&apos;s
          what most of this post is about.
        </p>

        <h2 id="tldr">The short version</h2>
        <ul>
          <li><strong>Media Foundation reads the MP4, NVDEC decodes it.</strong>{" "}Windows&apos; built-in Source Reader hands
            over compressed H.264 or HEVC packets, and NVIDIA&apos;s Video Codec SDK decodes them on the GPU&apos;s dedicated
            video engine. No FFmpeg.</li>
          <li><strong>CUDA converts NV12 to RGBA in place.</strong> The decoder outputs NV12; a small CUDA kernel converts
            it, writing straight into a D3D12 texture that CUDA has imported as external memory.</li>
          <li><strong>wgpu-hal wraps that texture.</strong> <code>texture_from_raw</code> and{" "}
            <code>create_texture_from_hal</code> turn the existing <code>ID3D12Resource</code> into an ordinary{" "}
            <code>wgpu::Texture</code> you can bind and sample in WGSL.</li>
          <li><strong>It&apos;s a working example, not a player.</strong>{" "}Synchronization is a blocking wait each frame,
            there&apos;s no audio, and it&apos;s Windows, D3D12 and NVIDIA only.</li>
        </ul>

        <h2 id="pipeline">Part 1: How the pipeline fits together</h2>
        <p>
          Five pieces of technology meet in this program, each doing one job. Here&apos;s the whole path a frame takes:
        </p>
        <ChartFigure title="From MP4 file to cube" subtitle="Only compressed bytes cross host memory." text={pipelineText}>
          <PipelineDiagram />
        </ChartFigure>
        <p>
          This is a <em>no-readback</em> pipeline, not a zero-work one. The GPU still does real work between decoder and
          screen: NVDEC writes NV12, the kernel writes RGBA, and the renderer samples it. What it avoids is the round trip
          through system memory, and with it the CPU copies and PCIe transfers.
        </p>

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
          second. The first is Media Foundation&apos;s job here.
        </p>

        <h3 id="what-nvdec-does">What NVDEC does</h3>
        <p>
          NVDEC is the fixed-function video decoder on NVIDIA GPUs. NVIDIA&apos;s{" "}
          <a href={NVDEC_GUIDE} {...ext}>NVDEC programming guide</a>{" "}puts it plainly: &ldquo;NVDEC runs completely
          independently of compute/graphics engine.&rdquo; Decoding doesn&apos;t take CUDA cores or shader time away from the
          renderer.
        </p>
        <p>The Video Codec SDK exposes it through the NVCUVID API. Four calls do most of the work:</p>
        <ArticleTable caption="The NVDEC calls this program uses" columns={["Call", "What it does"]} rows={[
          [<code key="a">cuvidCreateVideoParser</code>, "Creates a parser for the codec. It runs on the CPU and finds where each picture starts and ends."],
          [<code key="b">cuvidParseVideoData</code>, "Feeds the parser a packet of compressed bytes. The parser answers through three callbacks."],
          [<code key="c">cuvidDecodePicture</code>, "Called from the parser's decode callback: kicks off decoding of one picture on NVDEC."],
          [<code key="d">cuvidMapVideoFrame</code>, "Post-processes a decoded picture into an output surface and returns a CUDA pointer to it. It must be unmapped again."],
        ]} />
        <p>
          The parser&apos;s three callbacks matter for B-frames, which are decoded in a different order than they&apos;re
          shown. The <em>sequence</em>{" "}callback fires when the stream&apos;s format is known (codec, size, chroma format),
          the <em>decode</em> callback when a picture is ready to decode, and the <em>display</em> callback when a picture
          is ready to be shown, in display order.
        </p>

        <h3 id="nv12-and-cuda">NV12, and why CUDA converts it</h3>
        <p>
          Video is stored as luma (brightness) and chroma (color difference), not RGB. NVDEC&apos;s output here is{" "}
          <strong>NV12</strong>: a full-resolution plane of 8-bit Y values, followed by a half-resolution plane of
          interleaved U and V pairs. Every 2×2 block of pixels shares one U and one V, so a frame takes 1.5 bytes per pixel
          instead of RGBA&apos;s 4.
        </p>
        <p>
          A fragment shader can&apos;t sample NV12 as if it were an RGBA texture, so something has to convert it. The
          decoded frame is already a CUDA pointer, so a CUDA kernel is the simplest place to do it: one thread per pixel,
          reading Y, U and V and writing RGBA. Converting in the shader would also work, with separate Y and UV textures,
          but it needs a different interop path and a more complex shader. CUDA keeps the WGSL to a single{" "}
          <code>textureSample</code>.
        </p>

        <h3 id="why-wgpu-hal">Why wgpu-hal</h3>
        <p>
          wgpu normally owns every texture it uses: <code>device.create_texture(&amp;descriptor)</code>{" "}allocates the memory,
          and wgpu tracks it from then on. Here the texture already exists. It&apos;s an <code>ID3D12Resource</code> that
          CUDA writes into, and wgpu should read <em>that</em> memory, not a copy.
        </p>
        <p>
          The high-level API can&apos;t take an existing D3D12 resource. <strong>wgpu-hal</strong>{" "}can: it&apos;s the layer
          underneath wgpu that implements each backend (D3D12, Vulkan, Metal), and wgpu exposes it through a few{" "}
          <code>unsafe</code> functions. <code>Device::as_hal</code>{" "}gives the underlying D3D12 device, wgpu-hal&apos;s{" "}
          <code>texture_from_raw</code> wraps a resource, and <code>Device::create_texture_from_hal</code>{" "}registers it with
          wgpu. After that it&apos;s an ordinary <code>wgpu::Texture</code>: views, bind groups and{" "}
          <code>textureSample</code> all work as usual.
        </p>
        <p>
          That&apos;s also why Direct3D 12 is involved at all. wgpu&apos;s Windows backend is D3D12, and CUDA can import D3D12
          resources as <a href={CUDA_INTEROP} {...ext}>external memory</a>. A D3D12 texture is the one thing both sides can
          use natively.
        </p>

        <h3 id="why-a-native-bridge">Why a C++/CUDA bridge</h3>
        <p>
          Rust could call NVCUVID, CUDA and Media Foundation directly through FFI bindings. For this project it&apos;s
          simpler to put all three in one C++ file, <code>native/video_bridge.cu</code>, because a CUDA kernel needs{" "}
          <code>nvcc</code> anyway, and the C APIs read most naturally in C++. Rust sees seven small functions:
        </p>
        <ArticleTable caption="What the bridge wraps" columns={["Interface", "Why it's there"]} rows={[
          ["NVIDIA Video Codec SDK (NVCUVID)", "The parser and the NVDEC decoder"],
          ["CUDA (driver and runtime APIs)", "The context, the imported texture memory and the color kernel"],
          ["Media Foundation and Direct3D 12", "Reading MP4 packets, and creating the shared textures"],
        ]} />
        <p>
          It&apos;s a choice, not a requirement of NVDEC. The trade-off is that all the unsafe interop lives in one file,
          behind a C ABI that hides Media Foundation and CUDA from the Rust side entirely.
        </p>

        <h2 id="setup">Part 2: Set up the project</h2>

        <h3 id="what-you-need">What you need</h3>
        <ul>
          <li><strong>Windows 11 x64 and an NVIDIA GPU with NVDEC</strong>, with a current driver. The driver provides{" "}
            <code>nvcuda.dll</code> and <code>nvcuvid.dll</code>, the only NVIDIA files the program loads at run time.</li>
          <li><strong>Rust stable with the MSVC toolchain</strong>, and Visual Studio 2022 Build Tools with the Windows SDK
            (for <code>nvcc</code>&apos;s host compiler and the D3D12 and Media Foundation headers).</li>
          <li><strong>The CUDA Toolkit</strong>, which sets <code>CUDA_PATH</code>.</li>
          <li><strong>The <a href="https://developer.nvidia.com/video-codec-sdk" {...ext}>NVIDIA Video Codec SDK</a></strong>,
            downloaded and extracted. It has the NVCUVID headers and <code>nvcuvid.lib</code>.</li>
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
          Seven files. The two that matter for the interop are <code>native/video_bridge.cu</code> and{" "}
          <code>src/video.rs</code>; the rest is setup and a standard wgpu cube that could be any mesh, a fullscreen quad or
          a material in an engine.
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
          wgpu is pinned to an exact version on purpose. The wgpu-hal calls used in Step 9 change shape between releases, so a
          version bump means revisiting that code. Default features are off, which leaves only the DX12 backend and WGSL.
        </p>
        <Source excerpt={src.cargoToml} language="toml" />
        <p>
          <code>windows</code> provides the <code>ID3D12Resource</code> type for the import, and <code>cc</code> drives{" "}
          <code>nvcc</code> from the build script.
        </p>

        <h3 id="build-script">Step 2: Compile CUDA from build.rs</h3>
        <p>
          The <code>cc</code>{" "}crate&apos;s CUDA mode runs <code>nvcc</code> on the bridge and links it as a static library.
          The script also checks for the SDK early, so a missing path fails with a clear message instead of a wall of
          linker errors.
        </p>
        <Source excerpt={src.buildRs} language="rust" />
        <p>Two lines in there took some digging, and both fix the same linker warning (LNK4098, two C runtimes in one binary):</p>
        <ul>
          <li><strong><code>.cudart(&quot;shared&quot;)</code>.</strong> In CUDA mode, <code>cc</code> links{" "}
            <code>cudart_static.lib</code> by default, which is built against the static C runtime. Rust uses the DLL one.</li>
          <li><strong><code>/NODEFAULTLIB:LIBCMT</code>.</strong> In CUDA 13, <code>cuda.lib</code>{" "}isn&apos;t an import
            library but a small static loader for the driver, also built against the static C runtime. This binds it to
            the same runtime as everything else.</li>
        </ul>
        <p>
          Both <code>cuda.lib</code> and <code>cudart.lib</code>{" "}load the driver&apos;s <code>nvcuda.dll</code> at run time, so
          the executable needs the NVIDIA driver but no CUDA Toolkit DLLs.
        </p>

        <h2 id="decoding">Part 3: Decode on the GPU</h2>
        <p>All of Part 3 is <code>native/video_bridge.cu</code>, in the order the bridge does it.</p>

        <h3 id="read-packets">Step 3: Read compressed packets</h3>
        <p>
          Media Foundation&apos;s <a href={SOURCE_READER} {...ext}>Source Reader</a>{" "}can either decode for you or hand over the
          stream as it is in the file. The bridge asks for the second: it deselects every stream, selects the first video
          stream, and sets its output type to the stream&apos;s own <em>native</em> type. No Media Foundation decoder is
          inserted, so <code>ReadSample</code> returns compressed packets.
        </p>
        <Source excerpt={src.openReader} language="cpp" />
        <p>
          Each packet arrives with its presentation time in 100 ns units, which is also the unit NVDEC&apos;s timestamps
          use, so it passes straight through. The codec settings (SPS and PPS for H.264) come from the media type&apos;s{" "}
          <code>MF_MT_MPEG_SEQUENCE_HEADER</code> and are fed to the parser first.
        </p>
        <p>
          There&apos;s one wrinkle: <strong>how the packet separates its NAL units</strong>. A raw H.264 or HEVC stream uses{" "}
          <em>Annex B</em> framing, where each NAL unit starts with a <code>00 00 01</code> or <code>00 00 00 01</code>{" "}start
          code. Inside an MP4 they&apos;re usually <em>length-prefixed</em>{" "}instead: four bytes of size, then the data.
          NVIDIA&apos;s own samples demux with FFmpeg and run its <code>mp4toannexb</code>{" "}filter before parsing. Media
          Foundation&apos;s MP4 source delivered Annex B for my test clips, but the bridge accepts both, in{" "}
          <code>native/bitstream.h</code>:
        </p>
        <Source excerpt={src.framing} language="cpp" />
        <p>
          The obvious check, &ldquo;does it start with a start code?&rdquo;, is wrong, and my first version used it. A
          4-byte length of 300 is <code>00 00 01 2C</code>, which looks exactly like a start code, so a length-prefixed sample
          whose first NAL unit was 256–511 bytes long went to the decoder unconverted. The length test is the strict one:
          the lengths must cover the sample exactly, and every NAL header&apos;s top bit (the <em>forbidden zero
          bit</em>) must be clear. Real Annex B data practically never passes it. The first sample decides the framing, and
          every later sample has to match:
        </p>
        <Source excerpt={src.readPacket} language="cpp" />
        <p>
          <code>bitstream.h</code> has no Windows or CUDA dependencies, so its tests run anywhere, including the two cases
          that used to be misread:
        </p>
        <CodeBlock kind="command" language="bash"
          code={"clang++ -std=c++17 -Wall -Wextra -pedantic native/tests/bitstream_test.cpp -o bitstream_test\n./bitstream_test"} />

        <h3 id="pick-the-gpu">Step 4: Pick the GPU wgpu uses</h3>
        <p>
          CUDA and wgpu must work on the same physical GPU, or the shared texture means nothing. On a laptop that isn&apos;t
          a given: mine has an Intel iGPU next to the RTX. <code>main.rs</code>{" "}asks wgpu for a high-performance adapter and
          refuses anything that isn&apos;t NVIDIA (vendor ID <code>0x10DE</code>). The bridge then finds the CUDA device with
          the same <strong>LUID</strong>, the locally unique ID Windows gives each adapter:
        </p>
        <Source excerpt={src.luid} language="cpp" />
        <p>
          The context is popped right after creation, and every later CUDA call pushes it first. That way the bridge never
          depends on which context happens to be current on the thread.
        </p>

        <h3 id="parser-and-decoder">Step 5: The parser and the decoder</h3>
        <p>
          The parser is created up front with the codec and the three callbacks. The decoder can&apos;t be: its size and
          surface count depend on the stream, which the parser only learns from the sequence header.
        </p>
        <Source excerpt={src.createParser} language="cpp" />
        <p>
          <code>ulMaxDisplayDelay</code>{" "}is the guide&apos;s &ldquo;max display callback delay&rdquo;: how many decoded frames
          the parser may hold before handing one to the display callback (0 means none). The reordering itself is the
          parser&apos;s job either way; the display callback always delivers frames in display order. The callbacks are
          static functions that forward to the bridge through <code>pUserData</code>:
        </p>
        <Source excerpt={src.callbacks} language="cpp" />
        <p>
          The sequence callback creates the decoder once the format is known. It rejects anything that isn&apos;t
          progressive 8-bit 4:2:0, asks <code>cuvidGetDecoderCaps</code>{" "}whether this GPU can decode it, and returns the
          number of decode surfaces. A return value above 1 overrides the parser&apos;s surface count, and NVIDIA&apos;s
          guide recommends <code>min_num_decode_surfaces</code> to keep memory use down:
        </p>
        <Source excerpt={src.onSequence} language="cpp" />
        <p>
          Note the two sizes. The <em>coded</em> size can be larger than the picture, because codecs store frames in whole
          blocks (16×16 macroblocks in H.264) and crop the rest. <code>display_area</code> and{" "}
          <code>ulTargetWidth</code>/<code>ulTargetHeight</code> describe the picture you actually want, and NVDEC applies
          them in its post-processing, when the frame is mapped.
        </p>

        <h3 id="map-a-frame">Step 6: Decode and map a frame</h3>
        <p>
          <code>nv_next</code>, the function Rust calls for each frame, feeds packets until the display callback has queued a
          frame. At the end of the file it sends an end-of-stream packet to flush the frames the parser is holding, and once
          those are drained it seeks back to the start and recreates the parser and decoder, so the clip loops:
        </p>
        <Source excerpt={src.feedLoop} language="cpp" />
        <p>Then it maps the frame, converts it, and unmaps it:</p>
        <Source excerpt={src.mapFrame} language="cpp" />
        <p>
          <code>cuvidMapVideoFrame</code> returns a CUDA device pointer to an output surface holding the NV12 frame, and its
          row <code>pitch</code>, which is usually wider than the image. The surface is borrowed: NVIDIA&apos;s guide says
          at most <code>ulNumOutputSurfaces</code> frames can be mapped at once, and{" "}
          <code>cuvidUnmapVideoFrame</code>{" "}&ldquo;must be called to make the output surface available&rdquo; again. So the
          kernel has to finish reading before the unmap, which is what the <code>cudaDeviceSynchronize</code> guarantees.
        </p>

        <h3 id="shared-textures">Step 7: Shared textures and the color kernel</h3>
        <p>
          The kernel writes into one of three RGBA textures, which the bridge creates on wgpu&apos;s own D3D12 device. This
          is the step where one allocation becomes usable by both CUDA and wgpu:
        </p>
        <ChartFigure title="One texture, two users" subtitle="Each of the three slots is a single allocation that CUDA writes and wgpu samples." text={sharedText}>
          <SharedTextureDiagram />
        </ChartFigure>
        <Source excerpt={src.sharedTextures} language="cpp" />
        <p>Each slot goes through the same steps:</p>
        <ol>
          <li><strong>A committed resource in a shared heap</strong>, <code>R8G8B8A8_UNORM</code>, with{" "}
            <code>ALLOW_SIMULTANEOUS_ACCESS</code> so two APIs can use it without layout transitions.</li>
          <li><strong>An NT handle</strong> from <code>CreateSharedHandle</code>, which is how CUDA opens a D3D12
            resource. wgpu doesn&apos;t need it: it&apos;s on the same device, so it gets the resource pointer itself.</li>
          <li><strong><code>cudaImportExternalMemory</code></strong>{" "}with the resource&apos;s allocation size, then a mipmapped
            array over that memory and a <em>surface object</em>, which is what a kernel writes textures through.</li>
        </ol>
        <p>The kernel is one thread per pixel:</p>
        <Source excerpt={src.kernel} language="cpp" />
        <p>
          The constants are the BT.709 limited-range matrix: Y runs from 16 to 235 rather than 0 to 255, hence the{" "}
          <code>1.164 × (Y − 16)</code>. Each thread reads its Y value, finds the U/V pair its 2×2 block shares, and writes
          one RGBA pixel through the surface object.
        </p>

        <h2 id="into-wgpu">Part 4: Hand the frames to wgpu</h2>

        <h3 id="c-abi">Step 8: A small C ABI</h3>
        <p>
          The bridge exports seven functions. <code>nv_texture</code> calls <code>AddRef</code> on the resource before
          returning it, so the Rust side can take ownership of that reference:
        </p>
        <Source excerpt={src.cAbi} language="cpp" />
        <p>
          On the Rust side the bridge is an opaque type, and the declarations mirror the exports. Nothing checks the two
          lists against each other, so any change has to be made in both:
        </p>
        <Source excerpt={src.rustExtern} language="rust" />
        <p>
          <code>Video</code> wraps the handle. It owns the bridge (its <code>Drop</code> calls <code>nv_close</code>), the
          three textures, and two frames: the one on screen and one frame of lookahead.
        </p>

        <h3 id="import-with-wgpu-hal">Step 9: Import the textures with wgpu-hal</h3>
        <p>
          <code>Video::open</code>{" "}is where the two halves meet. It gets the raw D3D12 device from wgpu, opens the bridge on
          it, decodes the first two frames, and then wraps each slot&apos;s resource as a <code>wgpu::Texture</code>:
        </p>
        <Source excerpt={src.open} language="rust" />
        <p>
          Every <code>unsafe</code>{" "}here is a promise the compiler can&apos;t check. wgpu&apos;s{" "}
          <a href={WGPU_DEVICE} {...ext}>documentation for <code>create_texture_from_hal</code></a> lists them:
        </p>
        <CodeBlock kind="output" label="wgpu 30.0.1, Device::create_texture_from_hal, Safety" code={`- \`hal_texture\` must be created from this device internal handle
- \`hal_texture\` must be created respecting \`desc\`
- \`hal_texture\` must be initialized
- \`initial_state\`, if it is not \`TextureUses::UNINITIALIZED\`, must
  match the actual driver-side layout/state of the wrapped resource at
  the moment of wrap.`} />
        <p>Here&apos;s how this code meets each one:</p>
        <ArticleTable caption="The safety contract, point by point" columns={["Requirement", "How it holds here"]} rows={[
          ["Created from this device", <span key="a">The bridge creates the resources on the <code>ID3D12Device</code> that <code>as_hal</code>{" "}returned, and the CUDA device is the one with that adapter&apos;s LUID.</span>],
          ["Matches the descriptor", <span key="b"><code>Rgba8Unorm</code> is <code>DXGI_FORMAT_R8G8B8A8_UNORM</code>; the size is the video&apos;s, with one mip level and one sample, as created. Usage is <code>TEXTURE_BINDING</code> only, because wgpu only ever samples them.</span>],
          ["Initialized", <span key="c">The first two slots are decoded into before the import. The third is wrapped before its first write, which is harmless here because wgpu only samples slots the bridge has returned. It&apos;s the one place this code leans on the contract.</span>],
          ["Initial state matches", <span key="d">The resources are created in <code>COMMON</code>, and wgpu is told <code>RESOURCE</code>. That holds for simultaneous-access textures: they&apos;re &ldquo;implicitly promoted from D3D12_RESOURCE_STATE_COMMON to the relevant state on first GPU access&rdquo; and decay back after each submission (<a href={D3D12_STATES} {...ext}>Microsoft&apos;s resource state docs</a>).</span>],
        ]} />
        <p>
          Ownership follows COM reference counting. <code>ID3D12Resource::from_raw</code> takes the reference{" "}
          <code>nv_texture</code>{" "}added, so wgpu&apos;s texture keeps the resource alive even after{" "}
          <code>nv_close</code>{" "}releases the bridge&apos;s own reference. And if anything fails halfway, the closure&apos;s
          error path still calls <code>nv_close</code>, so a failed open doesn&apos;t leak the decoder.
        </p>

        <h3 id="sample-in-wgsl">Step 10: Sample the video in WGSL</h3>
        <p>
          From here it&apos;s ordinary wgpu. Each slot gets its own bind group with the same uniform buffer and sampler, so
          switching frames is just binding a different group:
        </p>
        <Source excerpt={src.bindGroups} language="rust" />
        <Source excerpt={src.setBindGroup} language="rust" />
        <p>The shader doesn&apos;t know the texture came from a video decoder:</p>
        <Source excerpt={src.shader} language="wgsl" />

        <h3 id="frame-timing">Step 11: Frame timing and synchronization</h3>
        <p>
          The cube redraws about every 16 ms, but the video has its own rate (24 frames per second for my clip). So{" "}
          <code>Video::update</code>{" "}runs every redraw and only switches frames when the lookahead frame&apos;s presentation
          time has come:
        </p>
        <Source excerpt={src.update} language="rust" />
        <p>
          The timestamps go through every layer unchanged: Media Foundation&apos;s sample time becomes the CUVID packet
          timestamp, comes back out with the decoded frame, and the bridge makes it relative to the first frame. A timestamp
          that goes backwards means the clip looped, so the clock restarts.
        </p>
        <p>
          The synchronization is the conservative part. The bridge decodes into slot <code>(current + 1) % 3</code>. With one
          slot on screen and one as lookahead, that&apos;s the slot shown two frames ago, which an earlier frame&apos;s
          rendering might still be reading. So before every decode, <code>update</code> waits for the GPU to go idle
          (<code>device.poll(Wait)</code>), and the bridge waits for the kernel to finish (<code>cudaDeviceSynchronize</code>)
          before returning.
        </p>
        <p>
          That makes it correct, but not concurrent: decode, conversion and rendering never overlap. The three slots are
          there for the next step. With per-slot D3D12 fences imported into CUDA as external semaphores, each side could wait
          only for the slot it needs, and decoding could move to its own thread. That&apos;s when three slots would become
          real triple buffering.
        </p>

        <h2 id="run-it">Part 5: Build and run</h2>
        <p>
          <strong>Step 12.</strong> No developer prompt is needed. <code>cc</code> finds the Visual Studio compiler for{" "}
          <code>nvcc</code> on its own. In PowerShell:
        </p>
        <CodeBlock kind="command" language="powershell" label="PowerShell" code={`$env:VIDEO_CODEC_SDK_DIR = "C:\\path\\to\\Video_Codec_SDK_13.1.15"
cargo run --release -- "C:\\Videos\\sample.mp4"`} />
        <p>A working start prints:</p>
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
          That clip is Constrained Baseline H.264, which has no B-frames, so it never exercised the reordering. A 4-second
          High-profile clip cut from it with ffmpeg (58 of its 96 frames are B-frames) also played through about four loops
          without errors, which covers the end-of-stream flush and the rewind. I didn&apos;t check the frame order frame by
          frame.
        </p>
        <p>
          The build also prints a few{" "}
          <code>Compiler family detection failed ... &quot;nvcc&quot; &quot;-E&quot;</code>{" "}warnings: that&apos;s{" "}
          <code>cc</code> probing <code>nvcc</code>, and it doesn&apos;t affect the build.
        </p>

        <h3 id="common-errors">Common errors</h3>
        <p>
          Build errors come from <code>build.rs</code>. At run time the bridge prints <code>[nvdec]</code> lines to stderr,
          and the same message ends the program.
        </p>
        <ArticleTable caption="Errors and what they mean" columns={["Message", "What to do"]} rows={[
          [<code key="a">Set VIDEO_CODEC_SDK_DIR to the extracted NVIDIA Video Codec SDK</code>, "Set the variable in the same terminal, pointing at the extracted folder."],
          [<code key="b">Could not locate SDK nvcuvid.lib (Lib/win/x64 or Lib/x64)</code>, "The path points at the wrong level (or at the zip). It should be the folder that contains Interface and Lib."],
          [<code key="c">Install the NVIDIA CUDA Toolkit (CUDA_PATH)</code>, "Install the CUDA Toolkit, then open a new terminal so CUDA_PATH is set."],
          [<code key="d">This sample requires wgpu to use an NVIDIA GPU (vendor 0x10DE)</code>, "wgpu picked another adapter, such as an iGPU. Check which GPU Windows assigns to the program."],
          [<code key="e">CUDA device LUID doesn&apos;t match the wgpu D3D12 NVIDIA adapter</code>, "CUDA can't see the GPU wgpu chose. Check the driver and that the CUDA Toolkit supports the GPU."],
          [<code key="f">Only native compressed H.264/HEVC MP4 is supported</code>, "The video uses another codec (AV1, VP9 and so on). Re-encode it, or extend the subtype check."],
          [<code key="g">Only progressive 8-bit 4:2:0 video is supported (NV12)</code>, "10-bit, 4:2:2 or interlaced video. See the limitations below."],
          [<code key="h">Codec/profile not supported by NVIDIA hardware</code>, "cuvidGetDecoderCaps says this GPU's NVDEC can't decode the stream's codec or profile."],
          [<code key="i">Invalid compressed NAL units (...)</code>, "The packets are neither Annex B nor 4-byte length-prefixed, or the framing changed mid-stream."],
        ]} />

        <h2 id="limitations">Limitations and next steps</h2>
        <p>
          This is a demonstration of the interop, not a video player. Some of the pieces a player needs would each be a
          post of their own:
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
          The demuxing and the bitstream parsing also run on the CPU. It&apos;s the decoding, the color conversion and the
          rendering that happen on the GPU.
        </p>

        <h3 id="color-accuracy">Color accuracy</h3>
        <p>
          The first version of this program had washed-out video, and the cause is easy to miss. The kernel writes
          gamma-encoded RGB, the same values a video player would show, into an <code>Rgba8Unorm</code> texture. wgpu
          samples them as if they were linear. And <code>main.rs</code> picked an sRGB swapchain format, which gamma-encodes
          everything written to it. The video was encoded twice, which pushes midtones toward white.
        </p>
        <ArticleFigure media={COLOR_COMPARISON} />
        <p>
          The fix is to render to a non-sRGB swapchain, so the values reach the screen unchanged. The clear color then needs
          its own conversion, since wgpu treats clear colors as linear only on sRGB targets:
        </p>
        <Source excerpt={src.swapchain} language="rust" />
        <Source excerpt={src.background} language="rust" />
        <p>
          I checked the result against an independent decode: ffmpeg&apos;s frame from the same moment of the clip, converted
          with the same BT.709 limited-range matrix, against the cube&apos;s pixels in the two captures above. The fixed
          version lands within a few levels of ffmpeg:
        </p>
        <ArticleTable caption="Average color of the cube's pixels, and of ffmpeg's frame" columns={["", "Average RGB", "Saturation", "Brightness"]} rows={[
          ["Before (sRGB swapchain)", "237, 231, 227", "0.08", "0.95"],
          ["After (Bgra8Unorm)", "220, 206, 198", "0.17", "0.90"],
          ["ffmpeg's decode", "217, 205, 197", "0.17", "0.88"],
        ]} />
        <p>
          The cube shows the frame in perspective, so this is an approximate check, but the difference is clear. One thing
          the fix doesn&apos;t cover: the kernel always assumes BT.709 limited range. My clip carries no color metadata at
          all, which is common, so a real player has to guess too, typically from the resolution.
        </p>

        <h3 id="synchronization">Synchronization</h3>
        <p>
          The blocking waits in Step 11 are the biggest cost. The proper version imports a D3D12 fence per slot into CUDA as an
          external semaphore (the same <a href={CUDA_INTEROP} {...ext}>CUDA interop API</a> has{" "}
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
          10-bit video (P010), 4:2:2, interlaced streams and mid-stream resolution changes are all rejected. NVDEC can decode
          more than this, AV1 included on newer GPUs, but each one needs a different output format, a different kernel, or a
          decoder that can be reconfigured. HDR also needs tone mapping, which is a topic of its own.
        </p>

        <h2 id="wrapping-up">Wrapping up</h2>
        <p>
          The useful result here is small and reusable: <strong>an NVDEC-decoded frame as an ordinary, sampleable{" "}
          <code>wgpu::Texture</code></strong>, with no trip through system memory. The cube is just where it&apos;s shown.
          The same three textures could feed a fullscreen quad, a material in a game engine, a video wall, or a compute pass.
          And since the frames are already in CUDA, it&apos;s also a starting point for running CUDA processing on decoded
          video before it&apos;s drawn.
        </p>
        <p>
          The parts that made it work were the LUID match, so CUDA and wgpu share one GPU; the shared, simultaneous-access
          texture, so both can use one allocation; and wgpu-hal, so wgpu can use memory it didn&apos;t allocate. The parts
          that needed fixing were the less obvious ones: the bitstream framing, two C runtimes, and gamma applied twice.
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
          <dt><strong>wgpu-hal</strong></dt><dd>The layer under wgpu that implements each backend. Its <code>unsafe</code> functions let you use native resources.</dd>
          <dt><strong>External memory</strong></dt><dd>CUDA&apos;s name for memory allocated by another API, such as a D3D12 resource, and imported through a handle.</dd>
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
