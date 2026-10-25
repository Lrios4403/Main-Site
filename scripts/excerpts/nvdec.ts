// Writes app/blogs/nvdec-with-rust-wgpu/code.ts: verbatim line ranges from the
// nvdec-wgpu-cube project, each with its file and first line number, so the
// post's code blocks show the real lines. It also records the project's GitHub
// repo and the commit the excerpts were read from, so each block can link to
// exactly those lines. Rerun after the project changes (and is committed), and
// move a range here if the lines it should cover have shifted.
// Usage (from the site root): bun scripts/excerpts/nvdec.ts <path to nvdec-wgpu-cube>
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "app/blogs/nvdec-with-rust-wgpu/code.ts";
const REPO = "https://github.com/Lrios4403/nvdec-wgpu-cube";

// name: [file, first line, last line], 1-based and inclusive
const RANGES: Record<string, [string, number, number]> = {
  cargoToml: ["Cargo.toml", 1, 16],
  buildRs: ["build.rs", 1, 43],
  kernel: ["native/video_bridge.cu", 32, 54],
  startMf: ["native/video_bridge.cu", 139, 150],
  openReader: ["native/video_bridge.cu", 151, 164],
  sequenceHeader: ["native/video_bridge.cu", 165, 179],
  luid: ["native/video_bridge.cu", 186, 213],
  createResource: ["native/video_bridge.cu", 216, 234],
  importToCuda: ["native/video_bridge.cu", 235, 258],
  callbacks: ["native/video_bridge.cu", 264, 277],
  formatChecks: ["native/video_bridge.cu", 278, 291],
  createDecoder: ["native/video_bridge.cu", 292, 323],
  createParser: ["native/video_bridge.cu", 325, 345],
  readPacket: ["native/video_bridge.cu", 369, 384],
  normalizePacket: ["native/video_bridge.cu", 385, 408],
  feedLoop: ["native/video_bridge.cu", 410, 430],
  mapFrame: ["native/video_bridge.cu", 431, 443],
  convertFrame: ["native/video_bridge.cu", 444, 462],
  cAbi: ["native/video_bridge.cu", 466, 485],
  framing: ["native/bitstream.h", 23, 48],
  rustExtern: ["src/video.rs", 10, 20],
  openBridge: ["src/video.rs", 54, 67],
  wrapTextures: ["src/video.rs", 69, 97],
  openEnd: ["src/video.rs", 98, 107],
  update: ["src/video.rs", 112, 136],
  drop: ["src/video.rs", 139, 145],
  adapter: ["src/main.rs", 84, 99],
  background: ["src/main.rs", 42, 50],
  swapchain: ["src/main.rs", 110, 115],
  bindGroups: ["src/main.rs", 166, 176],
  setBindGroup: ["src/main.rs", 276, 280],
  shader: ["src/cube.wgsl", 1, 26],
  // Part 6: the pieces the steps skipped, file by file
  bridgeIncludes: ["native/video_bridge.cu", 1, 30],
  utf8: ["native/video_bridge.cu", 56, 63],
  outputSlot: ["native/video_bridge.cu", 64, 76],
  bridgeState: ["native/video_bridge.cu", 78, 98],
  helpers: ["native/video_bridge.cu", 100, 120],
  destructor: ["native/video_bridge.cu", 122, 136],
  init: ["native/video_bridge.cu", 346, 351],
  rewind: ["native/video_bridge.cu", 352, 368],
  startCode: ["native/bitstream.h", 1, 21],
  normalize: ["native/bitstream.h", 50, 79],
  testHelpers: ["native/tests/bitstream_test.cpp", 1, 31],
  testCases: ["native/tests/bitstream_test.cpp", 33, 78],
  videoImports: ["src/video.rs", 1, 8],
  videoTypes: ["src/video.rs", 22, 37],
  decode: ["src/video.rs", 40, 52],
  mainImports: ["src/main.rs", 1, 13],
  vertexCube: ["src/main.rs", 15, 40],
  depthTexture: ["src/main.rs", 52, 63],
  stateStruct: ["src/main.rs", 65, 80],
  surfaceConfig: ["src/main.rs", 116, 129],
  buffers: ["src/main.rs", 130, 141],
  bindLayout: ["src/main.rs", 142, 165],
  pipeline: ["src/main.rs", 177, 212],
  resize: ["src/main.rs", 217, 223],
  drawMatrices: ["src/main.rs", 225, 234],
  acquire: ["src/main.rs", 235, 256],
  renderPass: ["src/main.rs", 257, 286],
  stateDrop: ["src/main.rs", 289, 293],
  app: ["src/main.rs", 295, 333],
  mainFn: ["src/main.rs", 335, 341],
  // Whole files
  fullBridge: ["native/video_bridge.cu", 1, 485],
  fullBitstream: ["native/bitstream.h", 1, 79],
  fullTest: ["native/tests/bitstream_test.cpp", 1, 78],
  fullVideo: ["src/video.rs", 1, 145],
  fullMain: ["src/main.rs", 1, 341],
};

// CodeBlock trims its code, which would strip only the first line's indent
function dedent(lines: string[]): string[] {
  const cut = Math.min(...lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length));
  return lines.map((line) => (line.trim() ? line.slice(cut) : ""));
}

const root = process.argv[2];
if (!root) throw new Error("Usage: bun scripts/excerpts/nvdec.ts <path to nvdec-wgpu-cube>");
const git = (...args: string[]) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
// The GitHub links point at this commit's lines, so the files must match it
const dirty = Object.values(RANGES).map(([file]) => file).filter((file, i, all) => all.indexOf(file) === i)
  .filter((file) => git("status", "--porcelain", "--", file));
if (dirty.length) throw new Error(`Commit these first, so the links match the excerpts: ${dirty.join(", ")}`);
const commit = git("rev-parse", "HEAD");
const files = new Map<string, string[]>();
const out = [
  "// Verbatim excerpts from the nvdec-wgpu-cube project, with the file and first",
  "// line number of each. Generated by scripts/excerpts/nvdec.ts: rerun it rather",
  "// than editing by hand, so the line numbers stay true.",
  "",
  "// whole: the excerpt is the entire file, not a range of it",
  "export type Excerpt = { file: string; start: number; code: string; whole: boolean };",
  "",
  "// The project on GitHub, and the commit these excerpts were read from",
  `export const REPO = ${JSON.stringify(REPO)};`,
  `export const COMMIT = ${JSON.stringify(commit)};`,
  "",
];
for (const [name, [file, first, last]] of Object.entries(RANGES)) {
  if (!files.has(file)) files.set(file, readFileSync(join(root, file), "utf8").replace(/\r\n?/g, "\n").split("\n"));
  const lines = files.get(file)!;
  if (last > lines.length) throw new Error(`${name}: ${file} has only ${lines.length} lines`);
  const code = dedent(lines.slice(first - 1, last)).join("\n");
  // A file ending in a newline splits into a last empty element, which isn't a line
  const length = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
  const whole = first === 1 && last >= length;
  out.push(`export const ${name}: Excerpt = { file: ${JSON.stringify(file)}, start: ${first}, code: ${JSON.stringify(code)}, whole: ${whole} };`, "");
}
writeFileSync(OUT, out.join("\n"));
console.log(`wrote ${OUT}: ${Object.keys(RANGES).length} excerpts`);
