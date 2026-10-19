import ArticleTable from "@/components/article/ArticleTable";
import BarChart, { type BarGroup } from "@/components/article/charts/BarChart";
import ChartFigure from "@/components/article/charts/ChartFigure";
import LineChart, { type LineSeries } from "@/components/article/charts/LineChart";
import chartStyles from "@/components/article/charts/Charts.module.css";
import { benchCode } from "./benchCode";

// Numbers from github.com/Lrios4403/Intel-Npu-Benchmarks (results/2026-10-17 and
// results/2026-10-18). Medians of 3 runs unless a row says otherwise.
const REPO = "https://github.com/Lrios4403/Intel-Npu-Benchmarks";

const tps = (n: number) => `${n} tokens/s`;
const pct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}%`;

const speedGroups: BarGroup[] = [
  {
    label: "Short prompt (52 tokens)",
    bars: [
      { label: "NPU", series: "npu", value: 10.0, display: "10.0" },
      { label: "CPU", series: "cpu", value: 9.9, display: "9.9" },
      { label: "Intel iGPU", series: "igpu", value: 10.6, display: "10.6" },
      { label: "RTX 5080", series: "rtx", value: 103.3, display: "103.3" },
    ],
  },
  {
    label: "Long prompt (4,329 tokens)",
    bars: [
      { label: "NPU", series: "npu", value: 6.5, display: "6.5" },
      { label: "CPU", series: "cpu", value: 6.7, display: "6.7" },
      { label: "Intel iGPU", series: "igpu", value: 9.8, display: "9.8" },
      { label: "RTX 5080", series: "rtx", value: 86.8, display: "86.8" },
    ],
  },
];

const ttftSeries: LineSeries[] = [
  { series: "cpu", label: "CPU", end: "87.8 s", points: [{ x: 52, y: 1.0, display: "1.0 s" }, { x: 1167, y: 21.14, display: "21.1 s" }, { x: 4329, y: 87.81, display: "87.8 s" }] },
  { series: "igpu", label: "iGPU", end: "53.8 s", points: [{ x: 52, y: 0.74, display: "0.7 s" }, { x: 1167, y: 8.74, display: "8.7 s" }, { x: 4329, y: 53.81, display: "53.8 s" }] },
  { series: "npu", label: "NPU", end: "30.5 s", points: [{ x: 52, y: 4.8, display: "4.8 s" }, { x: 1167, y: 10.73, display: "10.7 s" }, { x: 4329, y: 30.49, display: "30.5 s" }] },
  { series: "rtx", label: "RTX", end: "1.5 s", points: [{ x: 60, y: 0.08, display: "0.08 s" }, { x: 1175, y: 0.4, display: "0.4 s" }, { x: 4337, y: 1.47, display: "1.5 s" }] },
];

const compileGroups: BarGroup[] = [
  {
    bars: [
      { label: "1,024", series: "npu", value: 39, display: "39 s" },
      { label: "2,048", series: "npu", value: 59, display: "59 s" },
      { label: "4,096", series: "npu", value: 56, display: "56 s" },
      { label: "16,384", series: "npu", value: 514, display: "514 s" },
      { label: "16,384 + PYRAMID", series: "npu", value: 69, display: "69 s" },
    ],
  },
];

const cache4k: BarGroup[] = [
  { label: "NPU, caching on", bars: [{ label: "First turn", series: "base", value: 26.7, display: "26.7 s" }, { label: "Cached", series: "npu", value: 8.4, display: "8.4 s" }] },
  { label: "NPU, caching off", bars: [{ label: "First turn", series: "base", value: 26.7, display: "26.7 s" }, { label: "Repeat", series: "npu", value: 23.4, display: "23.4 s" }] },
  { label: "Intel iGPU", bars: [{ label: "First turn", series: "base", value: 46.9, display: "46.9 s" }, { label: "Cached", series: "igpu", value: 1.6, display: "1.6 s" }] },
  { label: "RTX 5080", bars: [{ label: "First turn", series: "base", value: 2.4, display: "2.4 s" }, { label: "Cached", series: "rtx", value: 0.5, display: "0.5 s" }] },
];
const cache11k: BarGroup[] = [
  { label: "NPU, caching on", bars: [{ label: "First turn", series: "base", value: 120.6, display: "120.6 s" }, { label: "Cached", series: "npu", value: 14.8, display: "14.8 s" }] },
  { label: "Intel iGPU", bars: [{ label: "First turn", series: "base", value: 261.6, display: "261.6 s" }, { label: "Cached", series: "igpu", value: 2.0, display: "2.0 s" }] },
  { label: "RTX 5080", bars: [{ label: "First turn", series: "base", value: 7.2, display: "7.2 s" }, { label: "Cached", series: "rtx", value: 2.1, display: "2.1 s" }] },
];

const stressGroups: BarGroup[] = [
  { label: "LLM on the NPU", bars: [{ label: "LLM speed", series: "npu", value: -2.6, display: pct(-2.6) }, { label: "Other work", series: "base", value: 7.7, display: pct(7.7) }] },
  { label: "LLM on the CPU", bars: [{ label: "LLM speed", series: "cpu", value: -28.2, display: pct(-28.2) }, { label: "Other work", series: "base", value: -10.6, display: pct(-10.6) }] },
  { label: "LLM on the Intel iGPU", bars: [{ label: "LLM speed", series: "igpu", value: 0.2, display: pct(0.2) }, { label: "Other work", series: "base", value: 3.1, display: pct(3.1) }] },
];

const memoryGroups: BarGroup[] = [
  {
    bars: [
      { label: "NPU", series: "ram", value: 21.3, display: "21.3 GB", segments: [{ series: "ram", value: 14.9, display: "14.9 GB" }, { series: "shared", value: 6.4, display: "6.4 GB" }] },
      { label: "Intel iGPU", series: "ram", value: 11.6, display: "11.6 GB", segments: [{ series: "ram", value: 5.2, display: "5.2 GB" }, { series: "shared", value: 6.4, display: "6.4 GB" }] },
      { label: "RTX 5080", series: "vram", value: 14.5, display: "14.5 GB VRAM", short: "14.5 GB", segments: [{ series: "vram", value: 14.5, display: "14.5 GB" }] },
    ],
  },
];

const thinkingGroups: BarGroup[] = [
  { label: "Bat-and-ball puzzle", bars: [
    { label: "NPU", series: "npu", value: 286, display: "286 s" },
    { label: "Intel iGPU", series: "igpu", value: 216, display: "216 s" },
    { label: "RTX 5080", series: "rtx", value: 25, display: "25 s" },
  ] },
  { label: "Write a Fibonacci function", bars: [
    { label: "NPU", series: "npu", value: 339, display: "339 s, hit the cap", short: "339 s (cap)" },
    { label: "Intel iGPU", series: "igpu", value: 339, display: "339 s, hit the cap", short: "339 s (cap)" },
    { label: "RTX 5080", series: "rtx", value: 38, display: "38 s" },
  ] },
  { label: "One tool call", bars: [
    { label: "NPU", series: "npu", value: 15, display: "15 s" },
    { label: "Intel iGPU", series: "igpu", value: 13.5, display: "13.5 s" },
    { label: "RTX 5080", series: "rtx", value: 1.5, display: "1.5 s" },
  ] },
];

const parallelSeries: LineSeries[] = [
  { series: "igpu", label: "iGPU", end: "9.2", points: [{ x: 1, y: 5.4, display: "5.4 tokens/s" }, { x: 2, y: 7.3, display: "7.3 tokens/s" }, { x: 4, y: 9.2, display: "9.2 tokens/s" }] },
  { series: "npu", label: "NPU", end: "6.5", points: [{ x: 1, y: 6.8, display: "6.8 tokens/s" }, { x: 2, y: 6.6, display: "6.6 tokens/s" }, { x: 4, y: 6.5, display: "6.5 tokens/s" }] },
];

export function Benchmarks() {
  return (
    <>
      <h2 id="benchmarks">Part 3: Benchmarks</h2>

      <p>
        Once it worked, the question was whether the NPU was actually worth using. So I benchmarked the same model on the
        NPU, the CPU, the Intel iGPU and the laptop&apos;s RTX 5080, over two days. Every script, raw result, resource log
        and server log is on GitHub at{" "}
        <a href={REPO} target="_blank" rel="noopener noreferrer">Lrios4403/Intel-Npu-Benchmarks</a>, so you can check the
        numbers or rerun them on your own machine.
      </p>

      <h3 id="bench-method">How I tested</h3>
      <ul>
        <li>
          <strong>Same model everywhere.</strong> Qwen3 8B: the <code>OpenVINO/Qwen3-8B-int4-cw-ov</code> export on OVMS
          2026.4.0 for the NPU, CPU and iGPU (the NPU uses the <a href="#launch-qwen3">launch command from Part 1</a>), and
          Ollama&apos;s <code>qwen3:8b</code>{" "}(Q4_K_M) on the RTX. That&apos;s the same base model in a different quantization
          and runtime, so treat the RTX numbers as a reference point, not a like-for-like race.
        </li>
        <li>
          <strong>Fair prompts.</strong> Thinking was off (<code>/no_think</code>) unless a test says otherwise. Every
          request started with a unique line so prompt caching couldn&apos;t make anything look faster, except in the caching
          test, which is built around it. Three runs per measurement; the charts show medians.
        </li>
        <li>
          <strong>Resources logged throughout.</strong>{" "}A monitor sampled CPU load, RAM, CPU package power (RAPL), the
          NPU&apos;s and GPUs&apos; engine load, shared GPU/NPU memory and the RTX (via <code>nvidia-smi</code>) every two
          seconds.
        </li>
        <li>
          <strong>Caveats.</strong> One laptop, plugged in, with normal apps open for some runs. Package power is rough. No
          battery test yet.
        </li>
      </ul>

      <h3 id="bench-speed">Generation speed</h3>
      <ChartFigure
        title="Generation speed, tokens per second"
        code={benchCode.speed}
        subtitle="Qwen3 8B, 256 output tokens. Higher is better."
        legend={[{ series: "npu" }, { series: "cpu" }, { series: "igpu" }, { series: "rtx" }]}
        caption="The RTX runs Ollama's Q4_K_M build of the same model; the others run the OpenVINO cw int4 build."
        table={{
          columns: ["Device", "Short prompt (52 tokens)", "Medium (1,167 tokens)", "Long (4,329 tokens)"],
          rows: [
            ["NPU", "10.0", "9.8", "6.5"],
            ["CPU", "9.9", "8.8", "6.7"],
            ["Intel iGPU", "10.6", "9.9", "9.8"],
            ["RTX 5080", "103.3", "98.0", "86.8"],
          ],
        }}
      >
        <BarChart id="chart-speed" title="Generation speed in tokens per second for each device" groups={speedGroups}
          max={110} ticks={[0, 25, 50, 75, 100]} />
      </ChartFigure>
      <p>
        <strong>The NPU isn&apos;t faster than the CPU or the iGPU.</strong> All three generate about 10 tokens/s, because an
        8B model is limited by memory bandwidth and they all share the same RAM. The RTX, with its own fast VRAM, is about
        10x faster. Where the NPU wins is that it does this without loading the CPU (more on that below).
      </p>

      <h3 id="bench-latency">Waiting for the first token</h3>
      <ChartFigure
        title="Time to first token vs prompt length"
        code={benchCode.ttft}
        subtitle="Seconds before the answer starts streaming. Lower is better."
        legend={[{ series: "npu", kind: "line" }, { series: "cpu", kind: "line" }, { series: "igpu", kind: "line" }, { series: "rtx", kind: "line" }]}
        table={{
          columns: ["Device", "~50-token prompt", "~1.2k tokens", "~4.3k tokens", "Prompt processing at 4.3k"],
          rows: [
            ["NPU", "4.8 s", "10.7 s", "30.5 s", tps(142)],
            ["CPU", "1.0 s", "21.1 s", "87.8 s", tps(49)],
            ["Intel iGPU", "0.7 s", "8.7 s", "53.8 s", tps(80)],
            ["RTX 5080", "0.08 s", "0.4 s", "1.5 s", tps(2947)],
          ],
        }}
      >
        <LineChart id="chart-ttft" title="Time to first token in seconds as the prompt grows, for each device" series={ttftSeries}
          xMax={4500} yMax={90} yTicks={[0, 30, 60, 90]} yFormat={(v) => `${v}s`}
          xTicks={[{ value: 0, label: "0" }, { value: 1000, label: "1k" }, { value: 2000, label: "2k" }, { value: 3000, label: "3k" }, { value: 4000, label: "4k" }]}
          xLabel="Prompt length (tokens)" xName={(v) => `${v.toLocaleString("en-US")} tokens`} />
      </ChartFigure>
      <p>
        <strong>The NPU always waits about 4.3–4.8 seconds before the first token, even for a one-line prompt.</strong> I
        expected the <code>MAX_PROMPT_LEN</code>{" "}setting to be the cause, but it isn&apos;t. The wait is the same at 1,024
        and at 16,384. The NPU processes prompts in blocks of about 1,000 tokens, so a 50-token prompt pays for a full
        block. Each extra block adds about 5 seconds, more as the context grows: ~21.5 s for 3.6k tokens and 2–3 minutes
        for 11.5k. On long prompts it&apos;s still the fastest of the Intel options (142 prompt tokens/s at 4.3k, vs 80 for
        the iGPU and 49 for the CPU).
      </p>
      <p>
        I also swept <code>MAX_PROMPT_LEN</code> with OpenVINO GenAI directly (no OVMS). Each setting was compiled from
        an empty cache, then reloaded from that cache in a fresh process:
      </p>
      <ArticleTable
        caption="Prompt limit sweep, Qwen3 8B on the NPU (OpenVINO GenAI 2026.4.1)"
        columns={["MAX_PROMPT_LEN", "First compile", "Cached reload", "First token (60 / 770 / 3.6k / 11.5k tokens)", "Generation"]}
        rows={[
          ["1,024", "39 s", "18 s", "4.3 / 4.3 s / rejected / —", "9.9 tokens/s"],
          ["2,048", "59 s", "21 s", "4.5 / 4.5 s", "9.6–9.9 tokens/s"],
          ["4,096", "56 s", "failed*", "4.5 / 4.5 / 21.5 s", "10.2 → 8.7 tokens/s"],
          ["16,384", "514 s", "failed*", "4.7 / 4.7 / 21.9 / 171 s", "10.1 → 8.2 → 5.9 tokens/s"],
          ["16,384 + PYRAMID", "69 s", "42 s", "5.2 / 4.7 / 21.9 / 148 s", "10.1 → 8.3 → 6.1 tokens/s"],
        ]}
      />
      <p>
        *The compile and the first run worked, but loading the cached compile in a new process failed with{" "}
        <code>Cannot find tensor for port</code>. That happened with GenAI 2026.4.1 directly. OVMS&apos;s own cache reloaded on
        every launch.
      </p>
      <ChartFigure
        title="First NPU compile time by prompt limit"
        code={benchCode.compile}
        subtitle="Seconds to compile Qwen3 8B for the NPU from an empty cache. Lower is better."
        caption="The PYRAMID prefill hint is what makes the 16k limit practical."
        table={{
          columns: ["MAX_PROMPT_LEN", "First compile"],
          rows: [["1,024", "39 s"], ["2,048", "59 s"], ["4,096", "56 s"], ["16,384", "514 s"], ["16,384 + PYRAMID", "69 s"]],
        }}
      >
        <BarChart id="chart-compile" title="First NPU compile time in seconds for each prompt limit" groups={compileGroups}
          max={560} ticks={[0, 100, 200, 300, 400, 500]} labelWidth={118} compactLabelWidth={108} />
      </ChartFigure>

      <h3 id="bench-caching">Prompt caching</h3>
      <p>
        Agent tools resend the same long system prompt and tool definitions on every turn, so prompt (prefix) caching
        matters more than raw speed. Each test below started a brand-new system prompt and sent four requests with
        different short questions:
      </p>
      <ChartFigure
        title="Time to first token: first turn vs cached turns"
        code={benchCode.cache}
        subtitle="Median of turns 2–4. Lower is better."
        legend={[
          { series: "base", label: "First turn (nothing cached)" },
          { series: "npu", label: "NPU, later turns" },
          { series: "igpu", label: "iGPU, later turns" },
          { series: "rtx", label: "RTX, later turns" },
        ]}
        caption={<>The NPU uses OVMS&apos;s <code>--enable_prefix_caching</code> (on by default here). The &ldquo;caching off&rdquo; row shows what it saves.</>}
        table={{
          columns: ["Setup", "4k prompt: first turn", "4k: later turns", "11k prompt: first turn", "11k: later turns"],
          rows: [
            ["NPU, caching on", "26.7 s", "8.2–8.4 s", "120.6 s", "14.8–17.9 s"],
            ["NPU, caching off", "26.7 s", "23.3–23.5 s", "—", "—"],
            ["Intel iGPU", "46.9 s", "1.6–1.7 s", "261.6 s", "1.9–2.1 s"],
            ["RTX 5080", "2.4 s", "0.5–0.6 s", "7.2 s", "1.9–2.1 s"],
          ],
        }}
      >
        <p className={chartStyles.panel}>4k-token system prompt</p>
        <BarChart id="chart-cache-4k" title="First-turn and cached time to first token with a 4k-token system prompt"
          groups={cache4k} max={50} ticks={[0, 10, 20, 30, 40, 50]} />
        <p className={chartStyles.panel}>11k-token system prompt</p>
        <BarChart id="chart-cache-11k" title="First-turn and cached time to first token with an 11k-token system prompt"
          groups={cache11k} max={280} ticks={[0, 50, 100, 150, 200, 250]} />
      </ChartFigure>
      <p>
        <strong>Caching works on the NPU, but it doesn&apos;t fix it.</strong>{" "}Repeat turns get 3x faster with a 4k prompt
        and 7–8x faster with 11k, and with caching off there&apos;s no gain at all. But every cached turn still costs ~8 s at
        4k and ~15 s at 11k. The iGPU&apos;s cache brings repeat turns down to about 1.5–2 seconds whatever the prompt
        length. A 4-turn chat that resends its growing history behaved the same way: NPU 27.5 s → ~8.3 s, iGPU 46.7 s →
        ~2.5 s, RTX 3.1 s → 0.2 s.
      </p>

      <h3 id="bench-load">Running next to other work</h3>
      <ChartFigure
        title="Slowdown under an all-core CPU load"
        code={benchCode.stress}
        subtitle="A 24-process SHA-256 job ran for 40 s while Qwen3 8B generated nonstop. Change vs each running alone."
        legend={[
          { series: "npu", label: "LLM speed on the NPU" },
          { series: "cpu", label: "LLM speed on the CPU" },
          { series: "igpu", label: "LLM speed on the iGPU" },
          { series: "base", label: "The CPU job's throughput" },
        ]}
        caption="Small gains are run-to-run variation, not real speedups. The CPU job alone did 7.18 million hashes per second."
        table={{
          columns: ["LLM on", "LLM alone", "LLM under the load", "CPU job's throughput"],
          rows: [
            ["NPU", tps(10.55), `${tps(10.28)} (${pct(-2.6)})`, `7.73 M/s (${pct(7.7)})`],
            ["CPU", tps(7.92), `${tps(5.69)} (${pct(-28.2)})`, `6.42 M/s (${pct(-10.6)})`],
            ["Intel iGPU", tps(12.78), `${tps(12.8)} (${pct(0.2)})`, `7.40 M/s (${pct(3.1)})`],
          ],
        }}
      >
        <BarChart id="chart-stress" title="Percent change in LLM speed and CPU job throughput when both run together"
          groups={stressGroups} min={-32} max={12} ticks={[-30, -20, -10, 0, 10]} tickFormat={(v) => `${v}%`} />
      </ChartFigure>
      <p>
        <strong>This is the NPU&apos;s real strength.</strong>{" "}Under full CPU load, NPU (and iGPU) generation kept its speed
        and didn&apos;t slow the other job down. Running the model on the CPU cost it 28% of its speed and took 11% from
        everything else. I also ran the NPU and the RTX at the same time. The NPU didn&apos;t notice (10.56 → 10.52 tokens/s),
        but the RTX dropped 15% (89 → 76 tokens/s), probably because the CPU package and the GPU share the laptop&apos;s
        power and cooling budget. A real <code>next build</code> of this site was too short (~12 s) and varied too much
        between runs to show any difference either way.
      </p>

      <h3 id="bench-memory">Memory</h3>
      <ChartFigure
        title="Memory held with the model loaded and idle"
        code={benchCode.memory}
        subtitle="Gigabytes. Shared accelerator memory comes out of system RAM; the RTX's VRAM doesn't."
        legend={[{ series: "ram" }, { series: "shared" }, { series: "vram" }]}
        caption="Peaks are higher: OVMS reached 19.3 GB while loading the NPU model, and NPU shared memory hit 11 GB with a 15.5k-token prompt."
        table={{
          columns: ["Server", "RAM held by the server", "Shared accelerator memory", "Dedicated VRAM", "Total"],
          rows: [
            ["NPU (16k limit + PYRAMID)", "14.9 GB", "6.4 GB", "—", "21.3 GB"],
            ["Intel iGPU", "5.2 GB", "6.4 GB", "—", "11.6 GB"],
            ["RTX 5080 (Ollama)", "~0 GB", "—", "14.5 GB", "14.5 GB"],
          ],
        }}
      >
        <BarChart id="chart-memory" title="Gigabytes of RAM, shared accelerator memory and VRAM held by each server while idle"
          groups={memoryGroups} max={34} ticks={[0, 8, 16, 24, 32]} reference={{ value: 31.4, label: "31.4 GB system RAM" }} />
      </ChartFigure>
      <p>
        <strong>RAM is the NPU&apos;s hidden cost.</strong> Kept loaded, the NPU server holds about three times the RAM of
        the iGPU server. With my usual apps open (browser, VS Code, chat apps), free RAM hit zero during NPU runs and
        Windows started paging. Most of it is the context reserved by <code>MAX_PROMPT_LEN</code>. With OpenVINO GenAI, a
        1,024 limit committed 3.6 GB, and 16,384 committed 11.3 GB. A small limit is how you fit an 8B model on a 16 GB
        machine, at the cost of rejecting long prompts.
      </p>

      <h3 id="bench-agents">Agent workloads</h3>
      <p>
        Tool calling was tested with 20 cases, all six tools offered every time: single calls with numbers, enums, lists
        and Unicode; prompts that need no tool; two calls in one turn; and using a tool&apos;s result.
      </p>
      <ArticleTable
        caption="Tool-call reliability (20 cases, temperature 0)"
        columns={["Model and backend", "Passed", "Time per case", "Notes"]}
        rows={[
          ["Qwen3 8B cw, NPU (OVMS, --tool_parser hermes3)", "20/20", "~8 s", "Perfect"],
          ["Qwen3 8B Q4_K_M, RTX 5080 (Ollama, think off)", "20/20", "~1.5 s", "Perfect"],
          ["Llama 3.1 8B (llmware NPU export), NPU (OVMS, --tool_parser llama3)", "11/20", "~8 s", "Empty arguments, invented tools, ignored tool results"],
        ]}
      />
      <ChartFigure
        title="Thinking mode on: time to a finished answer"
        code={benchCode.thinking}
        subtitle="Qwen3's default in agent tools. Up to 3,000 tokens. Lower is better."
        legend={[{ series: "npu" }, { series: "igpu" }, { series: "rtx" }]}
        caption="The NPU and iGPU runs of the Fibonacci task reasoned past the 3,000-token cap without answering."
        table={{
          columns: ["Task", "NPU", "Intel iGPU", "RTX 5080"],
          rows: [
            ["Bat-and-ball puzzle", "286 s (2,520 tokens)", "216 s (1,887 tokens)", "25 s (1,814 tokens)"],
            ["Fibonacci function", "339 s, hit the cap", "339 s, hit the cap", "38 s (2,840 tokens)"],
            ["One tool call", "15 s", "13.5 s", "1.5 s"],
          ],
        }}
      >
        <BarChart id="chart-thinking" title="Seconds to a finished answer with thinking on, per task and device"
          groups={thinkingGroups} max={400} ticks={[0, 100, 200, 300, 400]} />
      </ChartFigure>
      <ChartFigure
        title="Parallel requests: combined speed"
        code={benchCode.parallel}
        subtitle="Requests sent at the same time, ~1.1k-token prompts, 128 output tokens each."
        legend={[{ series: "npu", kind: "line" }, { series: "igpu", kind: "line" }]}
        caption="The RTX 5080 managed 56 / 80 / 74 tokens/s for 1 / 2 / 4 requests."
        table={{
          columns: ["Requests at once", "NPU: total time / combined speed", "Intel iGPU", "RTX 5080"],
          rows: [
            ["1", "15.6 s / 6.8 tokens/s", "16.0 s / 5.4 tokens/s", "2.0 s / 56 tokens/s"],
            ["2", "32.1 s / 6.6 tokens/s", "30.4 s / 7.3 tokens/s", "2.7 s / 80 tokens/s"],
            ["4", "63.5 s / 6.5 tokens/s", "40.9 s / 9.2 tokens/s", "5.8 s / 74 tokens/s"],
          ],
        }}
      >
        <LineChart id="chart-parallel" title="Combined tokens per second for 1, 2 and 4 simultaneous requests" series={parallelSeries}
          xMax={4.4} yMax={10} yTicks={[0, 2.5, 5, 7.5, 10]}
          xTicks={[{ value: 1, label: "1" }, { value: 2, label: "2" }, { value: 4, label: "4" }]}
          xLabel="Requests at the same time" xName={(v) => `${v} at once`} />
      </ChartFigure>
      <ul>
        <li>
          <strong>Tool calling is reliable</strong> with Qwen3 8B and <code>--tool_parser hermes3</code>, but every call
          takes about 8 seconds on the NPU.
        </li>
        <li>
          <strong>Thinking mode costs minutes per answer on the NPU.</strong>{" "}That&apos;s fine for a background job, but too
          slow to sit and wait for.
        </li>
        <li>
          <strong>The NPU handles one request at a time.</strong> Extra requests queue (they finished at 16, 32, 48 and 63
          s), while the iGPU and the RTX batch them. Agents that fan out sub-tasks will wait in line.
        </li>
        <li>
          <strong>If you use Ollama&apos;s OpenAI-compatible endpoint</strong> (<code>http://localhost:11434/v1</code>),
          Qwen3 ignores <code>/no_think</code>. It reasons until it hits the token limit and can return an empty answer.
          Its native API with <code>think: false</code> works.
        </li>
      </ul>

      <h3 id="bench-power">Power, heat and long runs</h3>
      <ArticleTable
        caption="8 minutes of nonstop generation (4 minutes on the RTX)"
        columns={["Device", "Speed, start → end", "Accelerator", "CPU package power", "Hottest sensor"]}
        rows={[
          ["NPU", "9.6 → 9.3 tokens/s", "NPU 97% busy", "26 W", "49 °C"],
          ["Intel iGPU", "8.6 → 10.8 tokens/s", "iGPU rail 8.2 W", "30 W", "51 °C"],
          ["RTX 5080", "68 → 75 tokens/s", "RTX 92% busy, 94 W (147 W peak)", "38 W", "82 °C (RTX)"],
        ]}
      />
      <p>
        <strong>Nothing throttled.</strong>{" "}NPU generation didn&apos;t raise CPU package power above my noisy idle baseline
        (26 W while generating, vs 29 W idle with apps open), while the iGPU&apos;s graphics rail drew about 8 W and the RTX
        about 95 W. Windows only exposes an ACPI thermal zone and the RTX&apos;s sensor, not the CPU die temperature. A
        proper battery-drain test is still on my list.
      </p>

      <h3 id="bench-models">Which models run on this NPU</h3>
      <ArticleTable
        caption="Models tested on the Intel AI Boost NPU (architecture 3720, driver 32.0.100.5540)"
        columns={["Model", "Format", "Result", "First compile / cached load", "Speed"]}
        rows={[
          [<code key="a">OpenVINO/Qwen3-8B-int4-cw-ov</code>, "int4, channel-wise", "Works", "33–69 s / 18–46 s", "~10 tokens/s"],
          [<code key="b">llmware/llama-3.1-8b-instruct-npu-ov</code>, "llmware NPU export", "Works", "161–179 s / 19–25 s", "10.2–10.4 tokens/s"],
          [<code key="c">OpenVINO/TinyLlama-1.1B-Chat-v1.0-int4-ov</code>, "int4", "Works", "86 s / 1.8 s", "33 tokens/s, 1.3 s first token"],
          [<code key="v">llmware/Qwen2.5-VL-3B-Instruct-ov-int4-npu</code>, "llmware NPU export, vision + text", "Runs, shaky answers (one session)", "Ready in 15 s, no compile wait", "~8 s for a short answer about an image"],
          [<code key="d">OpenVINO/Qwen3-8B-int4-ov</code>, "int4, group-wise", "Compile fails", "—", "—"],
          [<code key="e">OpenVINO/Qwen3-0.6B-int4-ov</code>, "int4, group-wise", "Compile fails", "—", "—"],
          [<code key="f">OpenVINO/Qwen2.5-Coder-0.5B-Instruct-int4-ov</code>, "int4, group-wise", "Compile fails", "—", "—"],
        ]}
      />
      <p>
        <strong>Use the channel-wise (<code>cw</code>) exports.</strong> This NPU generation rejects the group-wise int4
        exports in its compiler (<code>Unsupported DequantizeOp configuration</code>; the full log is under <a href="#model-compile-fails">Troubleshooting</a>). That&apos;s exactly
        why my first attempt with the plain <code>Qwen3-8B-int4-ov</code>{" "}didn&apos;t work. Size doesn&apos;t matter here:
        the 0.6B fails the same way. OVMS&apos;s own reference asks for NPU models exported with{" "}
        <code>--group-size -1</code>, which is channel-wise.
      </p>
      <p>
        <strong>Vision models run too.</strong>{" "}On October 19 I served llmware&apos;s Qwen2.5-VL 3B NPU export with OVMS
        (<code>--model_path</code> and <code>--target_device NPU</code>, none of the Qwen3 flags) and asked it about this
        post&apos;s cover chart, shrunk to 560×294. The NPU was near 100% busy for most of each answer, and it picked out
        the longest bar and its value (though it
        read &ldquo;RTX 5080&rdquo; as &ldquo;RTX 5000&rdquo;). The answers were shaky otherwise: asked what an NPU is, it
        explained an NPC, and a second question about the chart stopped after 20 tokens. OVMS&apos;s reference says NPU
        vision requests must include exactly one image, but on 2026.4 a text-only request was answered too. That was one
        short session, so read it as &ldquo;it runs&rdquo;, not as a benchmark.
      </p>

      <h3 id="bench-article">Checking another NPU guide</h3>
      <p>
        I also tested the setup from a Medium guide,{" "}
        <a href="https://medium.com/@trevisan3008/how-to-use-your-intel-npu-to-run-local-llms-a8d17f835f37" target="_blank" rel="noopener noreferrer">
          &ldquo;How to use your Intel NPU to run local LLM&apos;s&rdquo;
        </a>{" "}
        by Trevisan. It runs OpenVINO GenAI&apos;s <code>LLMPipeline</code> directly with{" "}
        <code>MAX_PROMPT_LEN: 1024</code>{" "}and llmware&apos;s Llama 3.1 8B export. What I found:
      </p>
      <ArticleTable
        caption="The guide's claims, tested on this laptop"
        columns={["Claim", "Result here"]}
        rows={[
          ["8–12 tokens/s for an 8B model on the NPU", "Confirmed: their Llama 3.1 8B ran at 10.35 tokens/s, Qwen3 8B at ~10"],
          ["The NPU is 3–5x more energy-efficient than a GPU", "Not verified. No method is given; here NPU generation added no measurable package power, while the RTX drew ~95–146 W"],
          ["Intel's NPU is physically tuned for 4-bit math", "Not for this NPU: OpenVINO reports FP16 and INT8 support only. INT4 is weight compression, unpacked at runtime"],
          [<code key="p">LLMPipeline(path, &quot;NPU&quot;, config)</code>, <span key="r">Works, but passing the config dict positionally is deprecated in GenAI 2026.4; use <code>**config</code></span>],
          [<code key="m">MAX_PROMPT_LEN: 1024</code>, "Works, and saves RAM, but longer prompts are rejected outright (too small for agent tools)"],
        ]}
      />
    </>
  );
}
