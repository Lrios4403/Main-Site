import BoxDiagram, { type DiagramBox } from "@/components/article/charts/BoxDiagram";

// The post's two diagrams: the whole pipeline, and how one D3D12 texture is
// shared by CUDA and wgpu. Like the other posts' diagrams, each has a wide
// layout and a 320-wide one for phones, plus a plain-text version.

/* ---------------------------------------------------------------- pipeline */

const PIPELINE_BOXES: DiagramBox[] = [
  { id: "mp4", title: "MP4 file", sub: "H.264 or HEVC" },
  { id: "mf", title: "Media Foundation", sub: "packets + timestamps" },
  { id: "parser", title: "NVDEC parser", sub: "runs on the CPU" },
  { id: "nvdec", title: "NVDEC", sub: "decodes to NV12" },
  { id: "cuda", title: "CUDA kernel", sub: "NV12 → RGBA" },
  { id: "tex", title: "D3D12 textures", sub: "3 shared slots" },
  { id: "hal", title: "wgpu-hal import", sub: "the same resources" },
  { id: "cube", title: "wgpu + WGSL", sub: "samples, draws the cube", accent: true },
];

export function PipelineDiagram() {
  return (
    <BoxDiagram
      id="diagram-pipeline"
      title="From file to cube: Media Foundation reads compressed packets from the MP4 and NVIDIA's parser splits them into pictures on the CPU. NVDEC decodes them into NV12 in GPU memory, a CUDA kernel converts each frame to RGBA in one of three shared D3D12 textures, and wgpu imports those textures through wgpu-hal and samples them on the cube."
      boxes={PIPELINE_BOXES}
      wide={{
        W: 480, H: 290,
        zones: [
          { label: "CPU: compressed bytes only", x: 8, y: 8, w: 464, h: 82 },
          { label: "GPU memory: decoded frames", x: 8, y: 112, w: 464, h: 170 },
        ],
        place: {
          mp4: { x: 20, y: 34, w: 136 }, mf: { x: 172, y: 34, w: 136 }, parser: { x: 324, y: 34, w: 136 },
          nvdec: { x: 324, y: 138, w: 136 }, cuda: { x: 172, y: 138, w: 136 }, tex: { x: 20, y: 138, w: 136 },
          hal: { x: 20, y: 222, w: 136 }, cube: { x: 172, y: 222, w: 136 },
        },
        edges: [
          { d: "M156,57 H169" },
          { d: "M308,57 H321" },
          { d: "M392,80 V135", label: "pictures", lx: 400, ly: 105 },
          { d: "M324,161 H311" },
          { d: "M172,161 H159" },
          { d: "M88,184 V219" },
          { d: "M156,245 H169" },
        ],
      }}
      compact={{
        W: 320, H: 596,
        // Shorter labels than the wide layout: the arrow at x=160 would cross a longer one
        zones: [
          { label: "CPU: compressed bytes", x: 6, y: 6, w: 308, h: 214 },
          { label: "GPU: decoded frames", x: 6, y: 240, w: 308, h: 348 },
        ],
        place: {
          mp4: { x: 40, y: 30, w: 240 }, mf: { x: 40, y: 96, w: 240 }, parser: { x: 40, y: 162, w: 240 },
          nvdec: { x: 40, y: 266, w: 240 }, cuda: { x: 40, y: 332, w: 240 }, tex: { x: 40, y: 398, w: 240 },
          hal: { x: 40, y: 464, w: 240 }, cube: { x: 40, y: 530, w: 240 },
        },
        edges: [
          { d: "M160,76 V93" },
          { d: "M160,142 V159" },
          { d: "M160,208 V263", label: "pictures", lx: 168, ly: 234 },
          { d: "M160,312 V329" },
          { d: "M160,378 V395" },
          { d: "M160,444 V461" },
          { d: "M160,510 V527" },
        ],
      }}
    />
  );
}

export const pipelineText = (
  <ol>
    <li>Media Foundation reads the MP4 and hands over compressed H.264 or HEVC packets with their timestamps. Nothing is decoded yet.</li>
    <li>NVIDIA&apos;s parser, running on the CPU, splits the packets into pictures and calls back when each one can be decoded and when it&apos;s due for display.</li>
    <li>NVDEC, the GPU&apos;s video decoding engine, decodes each picture into NV12 in GPU memory.</li>
    <li>A CUDA kernel converts the NV12 frame to RGBA, writing straight into one of three D3D12 textures.</li>
    <li>wgpu wraps those same three textures through wgpu-hal, and the WGSL shader samples the current one onto the cube.</li>
    <li>Only compressed bytes pass through host memory. Decoded frames stay in GPU memory from NVDEC to the screen.</li>
  </ol>
);

/* ---------------------------------------------------------- shared texture */

const SHARED_BOXES: DiagramBox[] = [
  { id: "device", title: "D3D12 device", sub: "wgpu's own device" },
  { id: "resource", title: "ID3D12Resource", sub: "RGBA, shared heap", accent: true },
  { id: "handle", title: "CreateSharedHandle", sub: "an NT handle for CUDA" },
  { id: "extmem", title: "cudaImportExternalMemory", sub: "CUDA external memory" },
  { id: "surface", title: "CUDA surface object", sub: "the kernel writes RGBA" },
  { id: "raw", title: "texture_from_raw", sub: "the same COM pointer" },
  { id: "hal", title: "create_texture_from_hal", sub: "a wgpu::Texture" },
  { id: "sample", title: "WGSL textureSample", sub: "one bind group per slot" },
];

export function SharedTextureDiagram() {
  return (
    <BoxDiagram
      id="diagram-shared"
      title="One texture, two users: the bridge creates an ID3D12Resource on wgpu's D3D12 device. CUDA opens it through a shared NT handle and imports it as external memory with a surface object the kernel writes to. wgpu wraps the same resource pointer with texture_from_raw and create_texture_from_hal, and the shader samples it."
      boxes={SHARED_BOXES}
      wide={{
        W: 480, H: 414,
        zones: [
          { label: "CUDA writes", x: 12, y: 168, w: 226, h: 238 },
          { label: "wgpu reads", x: 242, y: 168, w: 226, h: 238 },
        ],
        place: {
          device: { x: 172, y: 16, w: 136 }, resource: { x: 140, y: 92, w: 200 },
          handle: { x: 26, y: 196, w: 198 }, extmem: { x: 26, y: 272, w: 198 }, surface: { x: 26, y: 348, w: 198 },
          raw: { x: 256, y: 196, w: 198 }, hal: { x: 256, y: 272, w: 198 }, sample: { x: 256, y: 348, w: 198 },
        },
        edges: [
          { d: "M240,62 V89", label: "CreateCommittedResource", lx: 248, ly: 80 },
          { d: "M200,138 V152 H125 V193" },
          { d: "M280,138 V152 H355 V193" },
          { d: "M125,242 V269" },
          { d: "M125,318 V345" },
          { d: "M355,242 V269" },
          { d: "M355,318 V345" },
        ],
      }}
      compact={{
        W: 320, H: 602,
        zones: [
          { label: "CUDA writes", x: 10, y: 148, w: 276, h: 214 },
          { label: "wgpu reads", x: 10, y: 380, w: 276, h: 214 },
        ],
        place: {
          device: { x: 40, y: 16, w: 240 }, resource: { x: 40, y: 82, w: 240 },
          handle: { x: 30, y: 172, w: 236 }, extmem: { x: 30, y: 238, w: 236 }, surface: { x: 30, y: 304, w: 236 },
          raw: { x: 30, y: 404, w: 236 }, hal: { x: 30, y: 470, w: 236 }, sample: { x: 30, y: 536, w: 236 },
        },
        edges: [
          { d: "M160,62 V79" },
          { d: "M148,128 V169" },
          { d: "M148,218 V235" },
          { d: "M148,284 V301" },
          { d: "M280,105 H302 V427 H269", label: "same resource", lx: 311, ly: 266, anchor: "middle", vertical: true },
          { d: "M148,450 V467" },
          { d: "M148,516 V533" },
        ],
      }}
    />
  );
}

export const sharedText = (
  <ol>
    <li>The bridge creates an RGBA <code>ID3D12Resource</code> with <code>CreateCommittedResource</code>{" "}on wgpu&apos;s own D3D12 device, in a shared heap with simultaneous access allowed.</li>
    <li>For CUDA: <code>CreateSharedHandle</code> gives an NT handle, <code>cudaImportExternalMemory</code> imports the resource, and a CUDA surface object over it is what the kernel writes RGBA pixels into.</li>
    <li>For wgpu: the same resource pointer (no handle needed, it&apos;s the same device) goes to <code>texture_from_raw</code> and <code>create_texture_from_hal</code>, which give an ordinary <code>wgpu::Texture</code>. The shader samples it through a bind group.</li>
    <li>There is one allocation per slot. CUDA and wgpu read and write the same memory, so they must take turns.</li>
  </ol>
);
