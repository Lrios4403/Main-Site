// Series identities for the article charts. Each key maps to a fixed colour in
// Charts.module.css ([data-s="…"]), so a device keeps the same colour in every
// chart. Devices use the first four validated categorical slots, in this order.
export type SeriesKey = "npu" | "cpu" | "igpu" | "rtx" | "base" | "ram" | "shared" | "vram";

export const SERIES_LABEL: Record<SeriesKey, string> = {
  npu: "NPU",
  cpu: "CPU",
  igpu: "Intel iGPU",
  rtx: "RTX 5080",
  base: "Baseline",
  ram: "RAM held by the server",
  shared: "Shared accelerator memory (from system RAM)",
  vram: "Dedicated VRAM",
};

export type LegendItem = { series: SeriesKey; label?: string; kind?: "bar" | "line" };
