import ArticleTable from "@/components/article/ArticleTable";
import { CodeBlock } from "@/components/article/CodeBlock";

export function QuickStart() {
  return <>
    <h2 id="quick-start">Quick start</h2>
    <p>This is my Windows setup for running Qwen3 locally on an Intel AI Boost NPU using
      OpenVINO Model Server, with optional OpenWork and Claude Code connections.
      The model server handles inference; the frontend sends it requests.</p>
    <ol>
      <li><a href="#intel-npu-drivers">Check the Intel NPU and install its driver</a>. Record the device and driver version before troubleshooting.</li>
      <li><a href="#install-ovms">Install OVMS and initialize its environment</a> in the terminal you will use to start the server.</li>
      <li><a href="#download-qwen3">Prepare the model for the first run</a>. Check the instructions matching your OVMS release before downloading.</li>
      <li><a href="#launch-qwen3">Start the Qwen3 configuration</a> with <code>--target_device NPU</code>.</li>
      <li><a href="#verify-npu">Check a response and NPU execution separately</a>. A model list alone is not enough.</li>
      <li>Once inference works, connect <a href="#openwork">OpenWork</a> or <a href="#claude-code">Claude Code</a> using the model ID and API base verified on your server.</li>
    </ol>
    <h2 id="environment">Setup details and evidence</h2>
    <p>I originally reported getting this model running. This guide does not yet include the exact software versions
      or an inference trace. These are the details the article currently establishes;
      they are not a new hardware test or a promise that every Intel NPU supports this setup.</p>
    <ArticleTable caption="Recorded environment" columns={["Item", "Recorded detail"]} rows={[
      ["Laptop / NPU", "OMEN MAX Gaming Laptop 16; Intel AI Boost NPU. Exact processor and NPU generation not recorded."],
      ["Windows / driver", "Windows commands are shown; tested Windows build and NPU driver version not recorded."],
      ["OVMS", "Exact tested release/build not recorded. Check the documentation for the release you install."],
      ["Model source", <code key="model">OpenVINO/Qwen3-8B-int4-cw-ov</code>],
      ["Model revision", "Not recorded; a repository name does not pin a model revision."],
      ["Configured model ID", <code key="id">Qwen3-8B</code>],
      ["Target / parser", "NPU / hermes3 in the original commands. Tool-call success is not separately evidenced."],
      ["Measurements", "No latency, throughput, memory, or power measurements included."],
    ]} />
    <ArticleTable caption="Model outcomes documented here" columns={["Configuration", "Outcome and limits"]} rows={[
      ["Qwen3 8B int4 / OVMS / NPU", "Author-reported working setup. No dated run log, pinned release or device trace included."],
      ["Qwen2 0.5B basic example", "Download syntax example below; not evidence of NPU compatibility on this laptop."],
      ["NoLlama alternative", "Configuration described below; no separate versioned compatibility test included."],
      ["Other models", "No verified pass/fail matrix available. Do not infer compatibility from model size alone."],
    ]} />
  </>;
}

export function FirstDownload() {
  return <>
    <h4 id="download-qwen3">First setup: download the model</h4>
    <p>The original launch example below does not include <code>--pull</code>.
      Treat model preparation and serving as separate steps. The <a href="https://docs.openvino.ai/2026/model-server/ovms_demos_llm_npu.html">OpenVINO 2026 NPU demo</a>
      uses <code>--pull</code> to prepare Qwen3, then configures and starts the server.
      Follow that release&apos;s complete sequence if you use it; its flags and API base differ from the unversioned setup recorded here.</p>
    <CodeBlock kind="command" label="Windows CMD — OpenVINO 2026 documentation example, not locally verified" code={`ovms.exe --pull --source_model OpenVINO/Qwen3-8B-int4-cw-ov --model_repository_path models --target_device NPU --task text_generation --tool_parser hermes3 --cache_dir .ov_cache --enable_prefix_caching true --max_prompt_len 2000`} />
    <p>This prepares files under <code>models</code> relative to the current directory. It uses the documentation&apos;s
      2,000-token prompt setting, not the 16,384 setting in my original launch command.
      Complete the matching configuration/serving steps in the linked demo; do not mix their paths or assume preparation has started an HTTP server.</p>
    <p>Before the first run, confirm that your downloaded model is in the repository used by your launch command
      and keep the preparation log. On later runs, reuse that repository and cache.
      The existing examples are preserved below; a model list does not establish that a missing model was downloaded.</p>
  </>;
}

export function VerificationNotes() {
  return <>
    <h2 id="verify-npu">Verify inference and NPU execution</h2>
    <p>The original OVMS examples list models through <code>/v3/models</code>, while the client examples use
      <code>/v1</code>. These are version-sensitive settings. Confirm the chat endpoint in your installed release&apos;s
      documentation before copying a client configuration. The OpenVINO 2026 NPU demo uses a <code>/v3</code> client base.</p>
    <p>This PowerShell request template uses that documented chat path and this article&apos;s configured model ID.
      It is not a captured successful run. Change the endpoint and model ID to match your server.</p>
    <CodeBlock kind="command" label="PowerShell — inference check template" code={`$requestBody = @{
  model = "Qwen3-8B"
  messages = @(@{ role = "user"; content = "Reply with one short sentence." })
  max_tokens = 64
  stream = $false
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "http://localhost:8000/v3/chat/completions" -Method Post -ContentType "application/json" -Body $requestBody`} />
    <ol>
      <li>Check that the server advertises the intended model ID. A successful discovery request establishes availability, not inference.</li>
      <li>Submit a short request and inspect the returned message. Save the request, response and server log, including errors.</li>
      <li>Inspect the server&apos;s device/compilation log and NPU activity during inference. The launch flag alone does not prove execution on that device.</li>
      <li>Test tool calling separately with a harmless tool definition. A text response is not a tool-call test; inspect the structured tool name and arguments before connecting an assistant.</li>
    </ol>
    <h2 id="troubleshooting">Troubleshooting the setup</h2>
    <h3 id="npu-not-detected">NPU missing or model compilation fails</h3>
    <p>Record the exact device, driver, OVMS release, model revision and error first. Check the release&apos;s device support
      and the driver installation. Keep download failures separate from compilation failures; changing a frontend setting
      cannot fix a backend that has not loaded the model.</p>
    <h3 id="endpoint-mismatch">Wrong endpoint or model ID</h3>
    <p>Check the host, port, API version and exact case of the configured model ID. A 404 can indicate a route mismatch;
      a model-list response still does not establish that the chat route works. Verify inference directly before debugging the frontend.</p>
    <h3 id="tool-calling">Text works but tool calling fails</h3>
    <p>Check the client&apos;s expected tool format, the model&apos;s tool support and the configured parser together.
      The <code>hermes3</code> flag records this configuration choice, not a guarantee that every request returns a valid tool call.</p>
    <h3 id="first-inference">Slow first request</h3>
    <p>Separate download, model loading, compilation and generation time. Record first-run and repeated requests separately
      with the same prompt and settings. This guide has no measured baseline to compare against.</p>
    <h2 id="glossary">Terms used in this guide</h2>
    <dl>
      <dt><strong>NPU</strong></dt><dd>A neural processing unit: the device targeted for inference in this setup.</dd>
      <dt><strong>OVMS</strong></dt><dd>OpenVINO Model Server, the backend serving a model over an API.</dd>
      <dt><strong>Quantization / int4</strong></dt><dd>Reduced-precision model representation. The model name here identifies an int4 export; that alone does not establish device compatibility.</dd>
      <dt><strong>Prefill and KV cache</strong></dt><dd>Prefill processes the input prompt; the attention key/value cache holds intermediate state used when generating subsequent tokens.</dd>
      <dt><strong>Tool parser</strong></dt><dd>A server setting for interpreting model output as structured tool calls. Verify the resulting calls separately from plain chat.</dd>
    </dl>
    <h2 id="update-notes">References and update notes</h2>
    <p><time dateTime="2026-10-11">October 11, 2026</time>: added setup navigation, evidence limits, endpoint guidance and verification templates.
      Original commands remain available; no new hardware results are claimed.</p>
    <p>Compare your release against the <a href="https://docs.openvino.ai/2026/model-server/ovms_demos_llm_npu.html">official NPU serving demo</a> and
      <a href="https://docs.openvino.ai/2026/model-server/ovms_docs_pull.html">model preparation documentation</a>.
      Driver, model and alternative-server references are in the Resources window.</p>
  </>;
}
