import ArticleTable from "@/components/article/ArticleTable";
import { CodeBlock } from "@/components/article/CodeBlock";

const REPO = "https://github.com/Lrios4403/Intel-Npu-Benchmarks";

export function WhatYouNeed() {
  return <>
    <h3 id="what-you-need">What you need</h3>
    <ul>
      <li><strong>A Core Ultra laptop with an NPU</strong> and the current Intel NPU driver:{" "}
        <a href="https://www.intel.com/content/www/us/en/download/794734/intel-npu-driver-windows.html" target="_blank" rel="noopener noreferrer">Intel NPU Driver for Windows</a>.
        I used 32.0.100.5540.</li>
      <li><strong>OpenVINO Model Server (OVMS) for Windows</strong>, the <code>python_off</code> package is enough:{" "}
        <a href="https://github.com/openvinotoolkit/model_server/releases" target="_blank" rel="noopener noreferrer">releases</a>.</li>
      <li><strong>About 20 GB of free RAM</strong> while the model is loaded (see <a href="#bench-memory">Memory</a>), and 5 GB of disk for the model.</li>
      <li><strong>Optionally, Python</strong>, to download with <code>huggingface_hub</code> or to <a href="#devices">list device names</a>. The <code>hf</code> CLI and OVMS itself download without it.</li>
    </ul>
    <p>Everything here was tested on one laptop over October 17–19, 2026. Other Core Ultra NPUs should behave the same way,
      but these are the exact versions behind every number on this page (full records in the{" "}
      <a href={`${REPO}/tree/main/results/2026-10-17`} target="_blank" rel="noopener noreferrer">benchmark repo</a>):</p>
    <ArticleTable caption="Test machine" columns={["Item", "Installed", "Latest at test time"]} rows={[
      ["Laptop", "HP OMEN MAX Gaming Laptop 16, plugged in", "—"],
      ["CPU / RAM", "Intel Core Ultra 9 275HX (24 cores) / 31.4 GB", "—"],
      ["Windows", "Windows 11 Pro 25H2, build 26200.9711", "—"],
      ["NPU", "Intel AI Boost: OpenVINO architecture 3720, 2 tiles, ~13 TOPS INT8", "—"],
      ["NPU driver", "32.0.100.5540 (2026-08-19)", "32.0.100.5540 (current)"],
      ["Intel iGPU driver", "32.0.101.8860", "32.0.101.9150"],
      ["NVIDIA RTX 5080 Laptop driver", "596.49 (CUDA 13.2)", "617.42"],
      ["OpenVINO Model Server", "2026.4.0 (OpenVINO 2026.4.0, GenAI 2026.4.0)", "2026.4.1 (hotfix, nothing NPU-specific)"],
      ["Ollama (RTX comparison)", "0.40.5", "0.40.6"],
      ["Model", <span key="m"><code>OpenVINO/Qwen3-8B-int4-cw-ov</code> (4.4 GB)</span>, "Revision not pinned"],
    ]} />
  </>;
}

export function VerifyNpu() {
  return <>
    <h3 id="verify-npu">Check that it works, and that the NPU is doing it</h3>
    <p>A model list only proves the model loaded. Send a real request and watch the NPU while it answers. Both API bases
      work on OVMS 2026.4: <code>/v1/chat/completions</code> and <code>/v3/chat/completions</code>.</p>
    <CodeBlock kind="command" label="Inference check" variants={[
      {
        label: "CMD · curl",
        language: "cmd",
        code: `curl http://localhost:8000/v3/chat/completions -H "Content-Type: application/json" -d "{\\"model\\": \\"Qwen3-8B\\", \\"max_tokens\\": 64, \\"messages\\": [{\\"role\\": \\"user\\", \\"content\\": \\"Reply with one short sentence. /no_think\\"}]}"`,
        note: <>In PowerShell, pick the PowerShell version: there <code>curl</code> is a different command.</>,
      },
      {
        label: "PowerShell",
        language: "powershell",
        code: `$requestBody = @{
  model = "Qwen3-8B"
  messages = @(@{ role = "user"; content = "Reply with one short sentence. /no_think" })
  max_tokens = 64
  stream = $false
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "http://localhost:8000/v3/chat/completions" -Method Post -ContentType "application/json" -Body $requestBody`,
      },
    ]} />
    <p>Expect about 4.5 seconds before the first token, then roughly 10 tokens a second. While it answers, the NPU should
      sit near 100% busy (the next block shows how to watch it) and CPU load should
      barely move. That&apos;s the whole point of the exercise.</p>
    <CodeBlock kind="command" label="NPU load" variants={[
      {
        label: "Task Manager + curl",
        language: "cmd",
        code: `curl http://localhost:8000/v3/chat/completions -H "Content-Type: application/json" -d "{\\"model\\": \\"Qwen3-8B\\", \\"max_tokens\\": 256, \\"messages\\": [{\\"role\\": \\"user\\", \\"content\\": \\"Explain how a CPU cache works in about 200 words. /no_think\\"}]}"`,
        note: <>Open Task Manager, go to Performance, select the NPU, then run this in CMD. The answer takes about 30 seconds,
          and the NPU graph should stay near 100% the whole time.</>,
      },
      {
        label: "PowerShell counter",
        language: "powershell",
        code: `Get-Counter '\\GPU Engine(*engtype_neural)\\Utilization Percentage' -SampleInterval 1 -MaxSamples 10`,
        note: <>Run it in a second window while a request is answering. It prints how busy the NPU is, once a second for 10 seconds.</>,
      },
    ]} />
  </>;
}

export function Devices() {
  return <>
    <h3 id="devices">Which device is which</h3>
    <p><code>--target_device</code> takes OpenVINO&apos;s device names. OVMS lists them when it starts:</p>
    <CodeBlock kind="output" label="OVMS startup log" code={`Available devices for Open VINO: CPU, GPU.0, GPU.1, NPU`} />
    <p>It doesn&apos;t say which GPU is which. On this laptop <code>GPU.1</code>{" "}is the RTX 5080: OpenVINO lists the NVIDIA
      card too, so &ldquo;GPU&rdquo; isn&apos;t one device here. Use the full name, <code>GPU.0</code>, for the Intel iGPU. To see
      the names (needs <code>pip install openvino</code>):</p>
    <CodeBlock kind="command" label="List device names" language="cmd" code={`python -c "import openvino as ov; c = ov.Core(); [print(d, c.get_property(d, 'FULL_DEVICE_NAME')) for d in c.available_devices]"`} />
    <CodeBlock kind="output" label="Output on this laptop" code={`CPU Intel(R) Core(TM) Ultra 9 275HX
GPU.0 Intel(R) Graphics (iGPU)
GPU.1 NVIDIA GeForce RTX 5080 Laptop GPU (dGPU)
NPU Intel(R) AI Boost`} />
    <p>I didn&apos;t run anything on <code>GPU.1</code>; the RTX numbers in Part 3 come from Ollama. Before deciding a model
      runs on the NPU, check these in order. Each one can pass while the next fails:</p>
    <ol>
      <li><strong>OpenVINO sees the NPU</strong>: <code>NPU</code>{" "}is in that list. If it isn&apos;t, install the current NPU
        driver (see <a href="#what-you-need">What you need</a>) first. OVMS can only use the devices on that list.</li>
      <li><strong>The model compiles and loads</strong>: <code>/v3/models</code>{" "}lists it. A model that fails to compile
        doesn&apos;t show up with an error; OVMS shuts down instead (see <a href="#model-compile-fails">below</a>).</li>
      <li><strong>It answers, on the NPU</strong>: the <a href="#verify-npu">inference check</a> returns text while the
        NPU graph in Task Manager is busy. A model list alone proves neither.</li>
    </ol>
  </>;
}

export function Troubleshooting() {
  return <>
    <h2 id="troubleshooting">Troubleshooting</h2>
    <h3 id="model-compile-fails">The model won&apos;t compile for the NPU</h3>
    <p>This is the group-wise Qwen3 0.6B on this NPU, with the same kind of command as above (OVMS log, trimmed):</p>
    <CodeBlock kind="output" label="OVMS log" code={`Available devices for Open VINO: CPU, GPU.0, GPU.1, NPU
Path already exists on local filesystem. Skipping download to path: ...\\models\\OpenVINO\\Qwen3-0.6B-int4-ov
Graph: graph.pbtxt created in: ...\\models\\OpenVINO\\Qwen3-0.6B-int4-ov
Initializing Language Model Legacy servable
[vpux-compiler] OneShotBufferizeVPU2VPUIP failed : Unsupported DequantizeOp configuration: ...
Compilation failed. Level0 pfnCreate2 result: ZE_RESULT_ERROR_INVALID_NULL_POINTER, code 0x78000007 ...
Mediapipe: Qwen3-0.6B state changed to: LOADING_PRECONDITION_FAILED
Couldn't start model manager`} />
    <p>Read it top to bottom: OVMS found the NPU, the model was on disk, the settings were written, and only the NPU
      compile failed. Then OVMS shut down, about 5 seconds after it started, so a client sees &ldquo;connection
      refused&rdquo;, not an error message.</p>
    <p>The cause is the quantization, not the size: the 0.6B model fails exactly like the 8B. These are group-wise int4
      exports, and OVMS&apos;s{" "}
      <a href="https://github.com/openvinotoolkit/model_server/blob/main/docs/llm/reference.md" target="_blank" rel="noopener noreferrer">LLM reference</a>{" "}
      says NPU models must be exported as INT4 with <code>--sym --ratio 1.0 --group-size -1</code>. A group size of -1 is
      channel-wise. Use a <code>-cw-</code> export or one made for the NPU; see <a href="#bench-models">which models work</a>.</p>
    <h3 id="prompt-too-long">Long prompts are rejected</h3>
    <CodeBlock kind="output" label="Error" code={`HTTP 400: Input length exceeds the maximum ...`} />
    <p>The prompt is longer than the compiled <code>--max_prompt_len</code>. Raise it at launch. Each step up costs RAM:
      about 3.6 GB committed at 1,024, 11.3 GB at 16,384.</p>
    <h3 id="endpoint-mismatch">404 or 400 from the client</h3>
    <p>What OVMS 2026.4 returned for each mistake in my tests. The 404 came back the same on <code>/v1</code> and{" "}
      <code>/v3</code>:</p>
    <ArticleTable caption="Client errors and what they mean" columns={["What the client gets", "What it means"]} rows={[
      ["Connection refused", "Nothing is listening: OVMS isn't running, it's on another port, or it shut down at startup because the model failed to compile."],
      [<code key="a">404 Mediapipe graph definition with requested name is not found</code>, <span key="b">The <code>model</code> in the request doesn&apos;t match <code>--model_name</code> exactly. Case matters, and the Hugging Face name (<code>OpenVINO/Qwen3-8B-int4-cw-ov</code>) gets this too.</span>],
      [<code key="c">400 Wrong endpoint. Allowed endpoints: /v[13]/chat/completions, ...</code>, <span key="d">The client&apos;s base URL already ends in <code>/chat/completions</code>, and the client added it again. The base URL is <code>http://localhost:8000/v1</code>.</span>],
      [<code key="e">400 Invalid request URL</code>, <span key="f">The path has no <code>/v1</code> or <code>/v3</code> in front of <code>/chat/completions</code>.</span>],
      [<code key="g">400 Input length exceeds ...</code>, <span key="h">The prompt is too long; see <a href="#prompt-too-long">above</a>.</span>],
    ]} />
    <p>If switching between <code>/v1</code> and <code>/v3</code> seems to fix a 404, check whether the model name changed
      at the same time: the path itself makes no difference. Run the <a href="#verify-npu">inference check</a> directly
      before debugging the frontend.</p>
    <h3 id="port-in-use">Another server already has the port</h3>
    <p>OVMS doesn&apos;t check that its port is free. With one OVMS serving on <code>127.0.0.1:8000</code>, I started a second
      one on the same port: no error, and both were listening. NoLlama defaults to port 8000 too. Check before you start
      a server:</p>
    <CodeBlock kind="command" language="cmd" code={`netstat -ano | findstr ":8000"`} />
    <CodeBlock kind="output" label="Two servers at once" code={`TCP    127.0.0.1:8000    0.0.0.0:0    LISTENING    5760
TCP    127.0.0.1:8000    0.0.0.0:0    LISTENING    34272`} />
    <p>The last number is the process ID; Task Manager&apos;s Details tab shows which program it is. Stop one server, or
      move one to another port and change the client&apos;s base URL to match.</p>
    <h3 id="tool-calling">Chat works but tool calls fail</h3>
    <p>The tool parser has to match the model&apos;s tool-call format: <code>--tool_parser hermes3</code>{" "}for Qwen3 (OVMS&apos;s
      reference says hermes3 also covers Qwen3), <code>llama3</code> for Llama 3.x. OVMS 2026.4 also ships{" "}
      <code>qwen3coder</code>, <code>mistral</code>, <code>phi4</code>, <code>gptoss</code> and others. Llama 3.1 with{" "}
      <code>llama3</code> was unreliable in my tests (11/20).</p>
    <p>The <code>&quot;tool_call&quot;: true</code>{" "}in OpenWork&apos;s config only tells OpenWork it can send tools; it doesn&apos;t
      make the server parse them. A working setup answers a tool request with a <code>tool_calls</code> entry, and the
      client then runs the tool. This is Qwen3 8B on the NPU, asked about the weather with a <code>get_weather</code> tool:</p>
    <CodeBlock kind="output" label="Response message, trimmed" language="json" code={`{
  "role": "assistant",
  "content": "",
  "tool_calls": [
    {
      "id": "sjhOpS9nS",
      "type": "function",
      "function": { "name": "get_weather", "arguments": "{\\"city\\": \\"Phoenix\\"}" }
    }
  ]
}`} />
    <p>If it describes the call in plain text instead, the parser is missing or doesn&apos;t match the model. OVMS picks the
      Qwen3 reasoning parser on its own (its log says <code>Auto-detected reasoning_parser: qwen3</code>), which is what
      moves thinking out of the answer and into <code>reasoning_content</code>.</p>
    <h3 id="first-inference">Slow first start, or a reload error</h3>
    <p>The first launch compiles the model for the NPU: about 70 seconds with the PYRAMID hint at a 16k limit, 8.5 minutes
      without it. Later launches load the ~760 MB compiled copy from <code>.ovcache</code> in about 30 seconds. If you use
      OpenVINO GenAI directly instead of OVMS and the reload fails, delete that cache folder:</p>
    <CodeBlock kind="output" label="Error" code={`Check 'foundPort.found()' failed at zero_infer_request.cpp: Cannot find tensor for port ...`} />
    <h3 id="claude-still-anthropic">Claude Code still talks to Anthropic</h3>
    <p>It wasn&apos;t launched through the router. Use <code>ccr code</code>, not <code>claude</code>.</p>
    <h3 id="ollama-thinking">Empty answers from Ollama&apos;s OpenAI endpoint</h3>
    <p>Through <code>http://localhost:11434/v1</code>, Qwen3 ignores <code>/no_think</code>, spends the whole token budget
      reasoning, and returns nothing. Use Ollama&apos;s native API with <code>think: false</code>, or allow enough tokens for the reasoning.</p>
  </>;
}

export function Glossary() {
  return <>
    <h2 id="glossary">Terms used in this guide</h2>
    <dl>
      <dt><strong>NPU</strong></dt><dd>Neural processing unit: the low-power AI accelerator built into Core Ultra chips (Intel AI Boost).</dd>
      <dt><strong>OVMS</strong></dt><dd>OpenVINO Model Server: serves a model over an OpenAI-compatible API.</dd>
      <dt><strong>Channel-wise int4 (<code>cw</code>)</strong></dt><dd>A 4-bit weight format with one scale per channel. It&apos;s the int4 format this NPU generation can compile; group-wise int4 isn&apos;t.</dd>
      <dt><strong>Time to first token</strong></dt><dd>The wait between sending a prompt and the first word of the answer. The NPU processes prompts in blocks of about 1,000 tokens, so it has a fixed ~4.5 s floor.</dd>
      <dt><strong>PYRAMID</strong></dt><dd>The NPU prefill attention hint (<code>NPUW_LLM_PREFILL_ATTENTION_HINT</code>). It cut the 16k compile from 514 to 69 seconds.</dd>
      <dt><strong>Prefix caching</strong></dt><dd>Reusing the processed prompt when a new request starts the same way. It matters for agents, which resend the same system prompt every turn.</dd>
      <dt><strong>Tool parser</strong></dt><dd>A server setting that turns the model&apos;s output into structured tool calls. It only reads the model&apos;s output; the client still runs the tool.</dd>
      <dt><strong>Model ID</strong></dt><dd>The name set with <code>--model_name</code>, which clients send as <code>model</code>. It isn&apos;t the Hugging Face name the model was downloaded from.</dd>
    </dl>
  </>;
}

export function UpdateNotes() {
  return <>
    <h2 id="update-notes">References and update notes</h2>
    <p><time dateTime="2026-10-19">October 19, 2026</time>: added what I checked on the laptop that day. The launch
      command now binds to <code>127.0.0.1</code>, as the benchmarks did, and has a version that serves a model folder you
      already have. Added the OVMS download option, how to tell the devices apart, the full compile-failure log, the error
      each client mistake returns, two servers on one port, what a working tool call looks like, NoLlama&apos;s NPU limits,
      and a vision model on the NPU.</p>
    <p><time dateTime="2026-10-18">October 18, 2026</time>: restructured the post around the benchmarks. Added two days of
      measurements (speed, latency, prompt caching, memory, load, agent workloads, power) against the CPU, the Intel iGPU
      and an RTX 5080, with the recorded test machine. Corrected the setup advice: <code>cw</code> models, the PYRAMID
      hint, and that both API bases work. Scripts and raw data:{" "}
      <a href={REPO} target="_blank" rel="noopener noreferrer">Lrios4403/Intel-Npu-Benchmarks</a>.</p>
    <p><time dateTime="2026-10-11">October 11, 2026</time>: added setup navigation, endpoint guidance and verification templates.</p>
    <p><time dateTime="2026-09-30">September 30, 2026</time>: first version, the setup only.</p>
    <p>Official references: the <a href="https://docs.openvino.ai/2026/model-server/ovms_demos_llm_npu.html">OVMS NPU serving demo</a>,
      the <a href="https://docs.openvino.ai/2026/model-server/ovms_docs_pull.html">model preparation documentation</a> and
      the <a href="https://github.com/openvinotoolkit/model_server/blob/main/docs/llm/reference.md">LLM reference</a> (NPU
      limits, tool parsers). Driver,
      model and tool links are in the Resources window.</p>
  </>;
}
