import SiteLayout from "@/components/site-layout/SiteLayout";
import { WhatYouNeed, VerifyNpu, Devices, Troubleshooting, Glossary, UpdateNotes } from "./SetupNotes";
import { Benchmarks } from "./Benchmarks";
import ArticleTable from "@/components/article/ArticleTable";
import { CodeBlock } from "@/components/article/CodeBlock";
import ChartFigure from "@/components/article/charts/ChartFigure";
import SetupDiagram from "@/components/article/charts/SetupDiagram";
import type { Metadata } from "next";
import { getPost } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/blog/metadata";
import ArticleShell from "@/components/article/ArticleShell";

// Title, description, dates and tags live in lib/posts.ts
const info = getPost("llms-on-an-intel-npu");

export const metadata: Metadata = buildPostMetadata(info);

const REPO = "https://github.com/Lrios4403/Intel-Npu-Benchmarks";

export default function BlogOpenVINOModelServerSetup() {
  return (
    <SiteLayout variant="detail">
    <ArticleShell post={info}>
        <p>
          My laptop has an Intel AI Boost NPU that sat idle while Claude burned through my token budget and the RTX
          5080 did all the real work. I wanted the small, boring LLM jobs to run on that spare chip instead. There was
          almost nothing written about how, so this post is what I worked out: how to run Qwen3 8B on the NPU with
          OpenVINO Model Server, how to point OpenWork and Claude Code at it, and, after two days of benchmarks against
          the CPU, the Intel iGPU and the RTX 5080, whether it&apos;s worth doing at all.
        </p>

        <h2 id="tldr">The short version</h2>
        <ul>
          <li>
            <strong>It works.</strong> Qwen3 8B runs on the NPU at about 10 tokens/s with working tool calls (20/20 in my
            tests). The NPU sits at ~95% busy while the CPU stays at its idle load.
          </li>
          <li>
            <strong>It isn&apos;t fast.</strong> The CPU and the Intel iGPU generate at the same ~10 tokens/s. The RTX 5080
            does ~100.
          </li>
          <li>
            <strong>It stays out of the way.</strong>{" "}Under a full CPU load, NPU generation kept its speed and didn&apos;t slow
            the other work. Running the model on the CPU instead lost 28% and slowed everything else by 11%.
          </li>
          <li>
            <strong>It&apos;s a poor fit for interactive agents.</strong> Every answer waits ~4.5 s for the first token, a
            cached 4k-token prompt still costs ~8 s per turn, thinking mode takes minutes, parallel requests queue, and
            the loaded server holds ~15 GB of RAM. For agent-style use, the Intel iGPU is the better Intel option.
          </li>
        </ul>
        <p>
          The setup is Part 1 and 2. The numbers are in <a href="#benchmarks">Part 3</a>, and all the scripts and raw
          data are on <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>

        <h2 id="setup">Part 1: Get the model running on the NPU</h2>
        <p>
          Two pieces: a model server that runs the model on the NPU, and a frontend that sends it requests. This part is
          the server. It takes about 15 minutes, most of it the model download.
        </p>

        <WhatYouNeed />

        <h3 id="install-ovms">Install OVMS</h3>
        <ol>
          <li>
            <p>Unzip the OVMS package somewhere, for example:</p>
            <CodeBlock kind="config" label="Setting" code={`C:\\Users\\YOUR_USERNAME\\Downloads\\ovms`} />
          </li>
          <li>
            <p>Open Command Prompt in that folder and initialize the OpenVINO environment. Do this in every new terminal you start OVMS from:</p>
            <CodeBlock kind="command" language="cmd" code={"setupvars.bat"} />
          </li>
        </ol>

        <h3 id="download-qwen3">Download the model (the cw one)</h3>
        <p>
          Download the channel-wise int4 export of Qwen3 8B into a model repository folder. The <code>-cw-</code> part
          matters: the plain <code>OpenVINO/Qwen3-8B-int4-ov</code> export fails to compile on this NPU generation, which
          is exactly what happened on my first try.
        </p>
        <CodeBlock kind="command" label="Download" variants={[
          {
            label: "CMD · hf CLI",
            language: "cmd",
            code: `hf download OpenVINO/Qwen3-8B-int4-cw-ov --local-dir "%USERPROFILE%\\Downloads\\models\\OpenVINO\\Qwen3-8B-int4-cw-ov"`,
            note: <>No Python needed. No <code>hf</code> yet? Install it once with{" "}
              <code>powershell -ExecutionPolicy ByPass -c &quot;irm https://hf.co/cli/install.ps1 | iex&quot;</code>, then open
              a new terminal.</>,
          },
          {
            label: "CMD · Python",
            language: "cmd",
            code: `python -c "from huggingface_hub import snapshot_download; snapshot_download('OpenVINO/Qwen3-8B-int4-cw-ov', local_dir=r'%USERPROFILE%\\Downloads\\models\\OpenVINO\\Qwen3-8B-int4-cw-ov')"`,
            note: <>Needs <code>pip install huggingface_hub</code> first.</>,
          },
          {
            label: "CMD · OVMS",
            language: "cmd",
            code: `ovms.exe --pull --source_model OpenVINO/Qwen3-8B-int4-cw-ov --model_repository_path "%USERPROFILE%\\Downloads\\models" --task text_generation`,
            note: <>Run it from the OVMS folder after <code>setupvars.bat</code>. <code>--pull</code> downloads and exits; it
              doesn&apos;t start a server.</>,
          },
        ]} />
        <p>
          All three put the model in <code>models\OpenVINO\Qwen3-8B-int4-cw-ov</code>. You can also skip this step: the
          launch command below downloads the model if that folder doesn&apos;t exist yet. When it does exist, OVMS uses it
          as is (the log says <code>Skipping download</code>). See the{" "}
          <a href="https://docs.openvino.ai/2026/model-server/ovms_docs_pull.html">model preparation docs</a>.
        </p>

        <h3 id="launch-qwen3">Start the server</h3>
        <p>
          From the OVMS folder, after <code>setupvars.bat</code>. This is the one command the rest of the post refers to:
        </p>
        <CodeBlock kind="command" label="Start the server" variants={[
          {
            label: "Model repository",
            language: "cmd",
            code: `ovms.exe ^
  --rest_port 8000 ^
  --rest_bind_address 127.0.0.1 ^
  --model_repository_path "%USERPROFILE%\\Downloads\\models" ^
  --source_model OpenVINO/Qwen3-8B-int4-cw-ov ^
  --model_name Qwen3-8B ^
  --task text_generation ^
  --target_device NPU ^
  --tool_parser hermes3 ^
  --max_prompt_len 16384 ^
  --plugin_config "{\\"NPUW_LLM_PREFILL_ATTENTION_HINT\\":\\"PYRAMID\\"}" ^
  --cache_dir .ovcache`,
            note: <>Finds the model under <code>models\OpenVINO\Qwen3-8B-int4-cw-ov</code>{" "}(or downloads it there) and writes
              these settings into that folder&apos;s <code>graph.pbtxt</code>, on every launch.</>,
          },
          {
            label: "A folder you already have",
            language: "cmd",
            code: `ovms.exe ^
  --rest_port 8000 ^
  --rest_bind_address 127.0.0.1 ^
  --model_path "%USERPROFILE%\\Downloads\\models\\OpenVINO\\Qwen3-8B-int4-cw-ov" ^
  --model_name Qwen3-8B ^
  --task text_generation ^
  --target_device NPU ^
  --tool_parser hermes3 ^
  --max_prompt_len 16384 ^
  --plugin_config "{\\"NPUW_LLM_PREFILL_ATTENTION_HINT\\":\\"PYRAMID\\"}" ^
  --cache_dir .ovcache`,
            note: <>Point <code>--model_path</code> at the folder itself. OVMS builds the settings in memory and writes nothing
              into the folder, and never downloads. Use it for a model that lives somewhere else or that you don&apos;t want
              changed.</>,
          },
        ]} />
        <p>
          The first launch compiles the model for the NPU, about 70 seconds, and saves the ~760 MB result in{" "}
          <code>.ovcache</code>. After that it&apos;s ready in about 30 seconds. What the flags do, and what I measured for them:
        </p>
        <ArticleTable caption="The launch flags" columns={["Flag", "What it does", "Measured"]} rows={[
          [<code key="1">--target_device NPU</code>, <span key="d">Runs inference on the NPU. CPU and GPU.0 (the Intel iGPU) also work with the same command; see <a href="#devices">which device is which</a>.</span>, "See the benchmarks"],
          [<code key="2">--max_prompt_len 16384</code>, "The longest prompt the NPU will accept, compiled into the model. Longer prompts get an HTTP 400.", "Costs RAM: ~3.6 GB committed at 1,024, ~11.3 GB at 16,384. The first-token wait is the same either way."],
          [<code key="3">--plugin_config</code>, "Sets the NPU prefill attention hint to PYRAMID.", "Cut the first 16k compile from 514 s to 69 s, and was the only 16k setting whose cache reloaded reliably."],
          [<code key="4">--tool_parser hermes3</code>, "Turns Qwen3's tool-call output into structured calls, which agent frontends need.", "20/20 tool-call cases passed."],
          [<code key="5">--cache_dir .ovcache</code>, "Keeps the compiled model so later launches skip the compile.", "Launch time 69 s → ~30 s."],
          [<code key="6">--model_name Qwen3-8B</code>, "The name clients must use, case included.", "—"],
          [<code key="7">--rest_port 8000</code>, "The HTTP API. Both /v1 and /v3 paths answer.", "—"],
          [<code key="8">--rest_bind_address 127.0.0.1</code>, <span key="b">Only this PC can connect. Leave it out and OVMS listens on every network interface (its default is <code>0.0.0.0</code>) with no authentication: the <code>apiKey</code> in the client configs below is never checked unless you start OVMS with <code>--api_key_file</code>.</span>, <span key="l">The startup log says so: <code>Authentication will be disabled</code></span>],
        ]} />
        <p>Check that the model is loaded:</p>
        <CodeBlock kind="command" language="cmd" code={"curl http://localhost:8000/v3/models"} />
        <p>It should list a model named <code>Qwen3-8B</code>.</p>

        <VerifyNpu />
        <Devices />

        <h2 id="frontend">Part 2: Connect an AI assistant</h2>
        <p>
          Any client that speaks the OpenAI chat API can use the server at <code>http://localhost:8000/v1</code>. Claude
          Code speaks Anthropic&apos;s API instead, so it needs a translator in between. Here&apos;s how the pieces fit:
        </p>
        <ChartFigure title="The local setup" subtitle="Two clients, one model server, the NPU.">
          <SetupDiagram id="diagram-setup" />
        </ChartFigure>

        <h3 id="openwork">OpenWork</h3>
        <p>OpenWork uses OpenCode internally, which can talk to any OpenAI-compatible provider.</p>
        <ol>
          <li>
            <p>With OVMS running, open your OpenWork workspace folder, usually:</p>
            <CodeBlock kind="config" label="Setting" code={`%USERPROFILE%\\OpenWork Chat`} />
          </li>
          <li>
            <p>Replace the contents of <code>opencode.jsonc</code> with:</p>
            <CodeBlock kind="config" label="JSON configuration" language="json" code={`{
  "$schema": "https://opencode.ai/config.json",
  "disabled_providers": [
    "opencode"
  ],
  "provider": {
    "ovms": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OVMS Local",
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "ovms-local"
      },
      "models": {
        "Qwen3-8B": {
          "name": "Qwen3 8B int4 (OVMS NPU)",
          "tool_call": true,
          "reasoning": true,
          "limit": {
            "context": 16384,
            "output": 4096
          }
        }
      }
    }
  },
  "model": "ovms/Qwen3-8B"
}`} />
          </li>
          <li><p>Restart OpenWork completely (it doesn&apos;t pick up config changes otherwise) and choose <strong>Qwen3 8B int4 (OVMS NPU)</strong> in the model picker.</p></li>
        </ol>
        <p>
          Expect at least ~4.5 seconds before each answer starts, and longer the first time a big prompt is sent. Prompt
          caching speeds up later turns (see <a href="#bench-caching">Prompt caching</a>). A 404 means the model ID in the
          config doesn&apos;t match <code>--model_name</code>; other errors are in{" "}
          <a href="#endpoint-mismatch">the error table</a>.
        </p>

        <h3 id="claude-code">Claude Code</h3>
        <p>
          Claude Code sends Anthropic Messages API requests, so it can&apos;t be pointed at OVMS directly. Claude Code Router
          sits in between and translates. This is for <strong>Claude Code</strong> only. The Claude desktop and web apps have
          no setting that swaps Claude for a local model.
        </p>
        <ol>
          <li>
            <p>Install both (Node.js 22 or newer):</p>
            <CodeBlock kind="command" language="cmd" code={`npm install -g @anthropic-ai/claude-code
npm install -g @musistudio/claude-code-router`} />
          </li>
          <li>
            <p>With OVMS running, open the router&apos;s configuration UI:</p>
            <CodeBlock kind="command" language="cmd" code={"ccr ui"} />
            <p>It opens at <code>http://127.0.0.1:3458</code>{" "}if it doesn&apos;t appear on its own.</p>
          </li>
          <li>
            <p>Add a custom provider for OVMS. If the router auto-detects the wrong protocol, turn auto-detection off and pick OpenAI Chat:</p>
            <CodeBlock kind="config" label="Setting" code={`Name: OVMS Local
API Endpoint: http://127.0.0.1:8000/v1
API Key: ovms-local
Protocol: OpenAI Chat
Model: Qwen3-8B`} />
          </li>
          <li><p>Run the provider&apos;s connection test, save it, and create a local client key if the router asks for one. It doesn&apos;t need to be a real Anthropic key.</p></li>
          <li><p>Start the router&apos;s gateway (it listens on <code>http://127.0.0.1:3456</code>), select the OVMS provider and <code>Qwen3-8B</code> in a profile, and launch Claude Code through it:</p>
            <CodeBlock kind="command" language="cmd" code={"ccr code"} />
          </li>
        </ol>
        <p>
          Requests now go Claude Code → router → OVMS → Qwen3 on the NPU. Claude Code sends long prompts (its system prompt
          plus tool definitions) on every turn, which is the NPU&apos;s weak spot: expect the first turn of a session to take a
          while, then ~8–15 s per cached turn, ~8 s per tool call, and minutes per answer if thinking is on. It&apos;s best for
          small background jobs, not for sitting and waiting.
        </p>

        <h3 id="nollama">Alternative backend: NoLlama</h3>
        <p>
          <a href="https://github.com/aweussom/NoLlama" target="_blank" rel="noopener noreferrer">NoLlama</a> is a lighter
          Python server that also runs OpenVINO models with an OpenAI-compatible API. Clone it, run{" "}
          <code>.\install.ps1</code> then <code>.\start.ps1</code>, and read the model ID from{" "}
          <code>curl http://localhost:8000/v1/models</code>. It uses port 8000 too, so stop OVMS first (two servers on one
          port <a href="#port-in-use">don&apos;t always complain</a>).
        </p>
        <p>
          <strong>Same API, not the same NPU features.</strong>{" "}NoLlama&apos;s README (checked October 19, 2026; v1.0.0 is
          its latest release) says its NPU path caps prompts at 4,096 tokens and has no tool calling, no prefix cache and no
          vision. Tool calling only works on its GPU and CPU paths. So with the model on the NPU, OpenWork and Claude Code
          can chat through NoLlama but can&apos;t use tools, which is most of what an agent does. For an agent on the NPU, use
          the OVMS setup above (20/20 tool calls, 16k prompts). I haven&apos;t benchmarked NoLlama; everything in Part 3 used
          OVMS.
        </p>

        <Benchmarks />

        <h2 id="verdict">Verdict: which device should run your local model?</h2>
        <ul>
          <li>
            <strong>The NPU</strong> is a good background helper: summaries, tagging, small scripted jobs. It runs about 10
            tokens/s without touching the CPU or GPU and without throttling. Accept the ~4.5 second wait before each
            answer, keep prompts short, and budget ~15 GB of RAM for it.
          </li>
          <li>
            <strong>The Intel iGPU</strong> (same command, <code>--target_device GPU.0</code>) is the better Intel option
            for agents. Generation speed is the same, but its prompt caching gets repeat turns down to ~1.5–2 seconds, it
            batches parallel requests, and the server holds a third of the RAM. It also leaves the CPU alone.
          </li>
          <li>
            <strong>The RTX 5080</strong> is about 10x faster at everything, if you can spare it and its ~95 W.
          </li>
          <li>
            <strong>Not the CPU</strong>, if you&apos;re doing anything else: it slowed my other work by 11% and lost 28% itself.
          </li>
        </ul>
        <p>
          So the chip I set out to use turned out to be the right one for exactly one job: cheap, slow, unattended work,
          which is what I wanted it for. For anything I&apos;m waiting on, the iGPU or the RTX.
        </p>

        <Troubleshooting />
        <Glossary />
        <UpdateNotes />
    </ArticleShell>
    </SiteLayout>
  );
}
