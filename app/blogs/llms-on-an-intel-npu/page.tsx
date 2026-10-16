import SiteLayout from "@/components/site-layout/SiteLayout";
import { QuickStart, FirstDownload, VerificationNotes } from "./SetupNotes";
import { CodeBlock } from "@/components/article/CodeBlock";
import type { Metadata } from "next";
import { getPost } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/blog/metadata";
import ArticleShell from "@/components/article/ArticleShell";

// Title, description, dates and tags live in lib/posts.ts
const info = getPost("llms-on-an-intel-npu");

export const metadata: Metadata = buildPostMetadata(info);


export default function BlogOpenVINOModelServerSetup() {
  return (
    <SiteLayout variant="detail">
    <ArticleShell post={info}>
        <QuickStart />

        <h2 id="abstract">Abstract</h2>

        <p>
          I have an OMEN MAX Gaming Laptop 16 and recently I have been working
          on a lot of side projects in my free time. I&apos;ve also been using
          Claude a lot since I got this laptop to become Peter Thiel&apos;s most
          feared 10x engineer.
        </p>

        <p>
          Unfortunately, Claude has the habit of spawning more workflows, and
          that just absolutely DRAINS my token usage and limits.
        </p>

        <p>
          Eventually I wanted to use a locally hosted model for smaller tasks
          and found out my laptop had an Intel AI Boost NPU that I could use
          instead of my GPU. This lets me run smaller LLM workloads without
          tying up the GPU while I am doing other work.
        </p>

        <p>
          Then I realized there was very little documentation explaining how
          to actually use this POS hardware chip for an LLM. After a lot of
          experimenting, I managed to get Qwen running on the NPU through
          OpenVINO.
        </p>

        <p>
          This page documents the setup I ended up using for OpenVINO Model
          Server, NoLlama, OpenWork, and Claude Code.
        </p>

        <hr />

        <h2 id="backend">Backend Model Server</h2>

        <p>
          The frontend AI application and the model server are separate pieces.
        </p>

        <CodeBlock kind="diagram" code={`Frontend
   |
   | OpenAI / Anthropic compatible API
   v
Model Server
   |
   v
OpenVINO
   |
   v
Intel NPU`} />

        <p>
          For the backend, I have mainly used OpenVINO Model Server and
          NoLlama.
        </p>

        <h3 id="ovms">OpenVINO Model Server</h3>

        <h4 id="intel-npu-drivers">Prerequisites</h4>

        <ul>
          <li>
            <strong>Python 3.12.X - Optional</strong>
            <p>
              OpenVINO Model Server has Windows packages with Python enabled
              and Python disabled. Some additional features and model workflows
              may require the Python-enabled package.
            </p>
          </li>

          <li>
            <strong>Intel NPU Drivers</strong>
            <p>
              Download and install the latest Intel NPU drivers from Intel:
            </p>

            <a
              href="https://www.intel.com/content/www/us/en/download/794734/intel-npu-driver-windows.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Intel NPU Driver for Windows
            </a>
          </li>
        </ul>

        <h4 id="install-ovms">Installation</h4>

        <ol>
          <li>
            <p>
              Download OpenVINO Model Server from the official repository:
            </p>

            <a
              href="https://github.com/openvinotoolkit/model_server"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/openvinotoolkit/model_server
            </a>
          </li>

          <li>
            <p>Extract OVMS somewhere on your computer.</p>

            <p>For example:</p>

            <CodeBlock kind="config" label="Setting" code={`C:\\Users\\YOUR_USERNAME\\Downloads\\ovms`} />
          </li>

          <li>
            <p>
              Open Command Prompt inside the OVMS directory and initialize the
              OpenVINO environment:
            </p>

            <CodeBlock kind="command" code={"setupvars.bat"} />
          </li>
        </ol>

        <h4>Useful OVMS Command Line Arguments</h4>

        <ul>
          <li>
            <code>--rest_port 8000</code>
            <p>
              Starts the HTTP REST API on port 8000. The OpenAI-compatible API
              is exposed through this server.
            </p>
          </li>

          <li>
            <code>--rest_bind_address 127.0.0.1</code>
            <p>
              Binds OVMS only to the local machine instead of exposing it to
              other devices on the network.
            </p>
          </li>

          <li>
            <code>--rest_workers N</code>
            <p>Controls the number of HTTP REST worker threads.</p>
          </li>

          <li>
            <code>--port 9000</code>
            <p>Enables the gRPC server on port 9000.</p>
          </li>

          <li>
            <code>--grpc_workers N</code>
            <p>Controls the number of gRPC worker threads.</p>
          </li>

          <li>
            <code>--pull</code>
            <p>
              Prepares the requested model. Whether serving starts in the same invocation depends on the release and other arguments; check the first-download notes below.
            </p>
          </li>

          <li>
            <code>--source_model MODEL</code>
            <p>
              Specifies the source model. This can be a supported model
              repository identifier such as an OpenVINO model hosted on
              Hugging Face.
            </p>
          </li>

          <li>
            <code>--model_repository_path PATH</code>
            <p>
              Specifies where downloaded models should be stored locally.
            </p>
          </li>

          <li>
            <code>--model_name NAME</code>
            <p>
              Specifies the name OVMS exposes through its API.
            </p>
          </li>

          <li>
            <code>--task text_generation</code>
            <p>
              Tells OVMS that the model should be served using the text
              generation pipeline.
            </p>
          </li>

          <li>
            <code>--target_device NPU</code>
            <p>
              Runs inference on the Intel NPU. Other OpenVINO targets can
              include CPU, GPU, AUTO, and device-specific combinations.
            </p>
          </li>

          <li>
            <code>--tool_parser hermes3</code>
            <p>
              Enables parsing model-generated Hermes-style tool calls. This is
              important when using the local model with agentic frontends that
              expect tool calling.
            </p>
          </li>

          <li>
            <code>--max_prompt_len 16384</code>
            <p>
              Configures the maximum prompt/context length accepted by the
              serving pipeline.
            </p>
          </li>

          <li>
            <code>--cache_dir .ovcache</code>
            <p>
              Stores OpenVINO&apos;s compiled model cache in the specified
              directory so future startups can avoid recompiling everything
              from scratch.
            </p>
          </li>
        </ul>

        <h4>Basic Example</h4>

        <CodeBlock kind="command" label="Windows CMD" code={`ovms.exe --pull --rest_port 8000 --source_model OpenVINO/Qwen2-0.5B-int4-ov --model_repository_path ".\\models" --task text_generation`} />

        <FirstDownload />
        <h4 id="launch-qwen3">NPU Qwen3 Example — subsequent launch</h4>

        <p>
          This is the configuration I use for Qwen3 8B on the Intel NPU:
        </p>

        <CodeBlock kind="command" label="Windows CMD" code={`ovms.exe ^
  --rest_port 8000 ^
  --model_repository_path "%USERPROFILE%\\Downloads\\models" ^
  --source_model OpenVINO/Qwen3-8B-int4-cw-ov ^
  --model_name Qwen3-8B ^
  --task text_generation ^
  --target_device NPU ^
  --tool_parser hermes3 ^
  --max_prompt_len 16384 ^
  --plugin_config "{\\"NPUW_LLM_PREFILL_ATTENTION_HINT\\":\\"PYRAMID\\"}" ^
  --cache_dir .ovcache`} />

        <p>To verify that OVMS loaded the model, run:</p>

        <CodeBlock kind="command" code={"curl http://localhost:8000/v3/models"} />

        <p>You should see a model named:</p>

        <CodeBlock kind="config" label="Setting" code={"Qwen3-8B"} />

        <p>
          The original client configurations below use this API base; verify it against your installed OVMS release (see the inference check):
        </p>

        <CodeBlock kind="config" label="Setting" code={"http://localhost:8000/v1"} />

        <hr />

        <h3 id="nollama">NoLlama</h3>

        <p>
          NoLlama provides another way to run OpenVINO-backed LLMs while
          exposing an OpenAI-compatible API.
        </p>

        <h4>Prerequisites</h4>

        <ul>
          <li>Python 3.X</li>

          <li>
            OpenVINO libraries
            <p>
              NoLlama&apos;s installation script should install the required Python
              packages using pip.
            </p>
          </li>

          <li>
            Intel NPU drivers if you want to run the model on the NPU.
          </li>
        </ul>

        <h4>Setup</h4>

        <ol>
          <li>
            <p>Clone the repository:</p>

            <CodeBlock kind="command" code={"git clone https://github.com/aweussom/NoLlama.git"} />

            <p>Repository:</p>

            <a
              href="https://github.com/aweussom/NoLlama"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/aweussom/NoLlama
            </a>

            <p>Releases:</p>

            <a
              href="https://github.com/aweussom/NoLlama/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/aweussom/NoLlama/releases
            </a>
          </li>

          <li>
            <p>Run the installation script:</p>

            <CodeBlock kind="command" code={".\\install.ps1"} />
          </li>

          <li>
            <p>Start NoLlama:</p>

            <CodeBlock kind="command" code={".\\start.ps1"} />
          </li>
        </ol>

        <p>Verify that the server is running:</p>

        <CodeBlock kind="command" code={"curl http://localhost:8000/v1/models"} />

        <p>
          NoLlama exposes an OpenAI-compatible server at:
        </p>

        <CodeBlock kind="config" label="Setting" code={"http://localhost:8000/v1"} />

        <hr />

        <h2 id="frontend">Frontend AI Assistants</h2>

        <p>
          Once an OpenAI-compatible backend is running, different frontend
          applications can connect to it.
        </p>

        <h3 id="openwork">OpenWork</h3>

        <p>
          OpenWork uses OpenCode internally and can directly use an
          OpenAI-compatible provider.
        </p>

        <h4>OpenWork With OVMS</h4>

        <ol>
          <li>
            <p>
              In the OVMS folder, run <code>setupvars.bat</code>.
            </p>
          </li>

          <li>
            <p>Start Qwen3 8B:</p>

            <CodeBlock kind="command" label="Windows CMD" code={`ovms.exe ^
  --rest_port 8000 ^
  --model_repository_path "%USERPROFILE%\\Downloads\\models" ^
  --source_model OpenVINO/Qwen3-8B-int4-cw-ov ^
  --model_name Qwen3-8B ^
  --task text_generation ^
  --target_device NPU ^
  --tool_parser hermes3 ^
  --max_prompt_len 16384 ^
  --plugin_config "{\\"NPUW_LLM_PREFILL_ATTENTION_HINT\\":\\"PYRAMID\\"}" ^
  --cache_dir .ovcache`} />
          </li>

          <li>
            <p>
              Check that OVMS is running and that the model is named
              Qwen3-8B:
            </p>

            <CodeBlock kind="command" code={"curl http://localhost:8000/v3/models"} />
          </li>

          <li>
            <p>
              Open your OpenWork workspace directory.
            </p>

            <p>The default is typically:</p>

            <CodeBlock kind="config" label="Setting" code={`%USERPROFILE%\\OpenWork Chat`} />
          </li>

          <li>
            <p>
              Replace the contents of <code>opencode.jsonc</code> with:
            </p>

            <CodeBlock kind="config" label="JSON configuration" code={`{
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

          <li>
            <p>Restart OpenWork.</p>
          </li>

          <li>
            <p>Open the model picker and select:</p>

            <CodeBlock kind="config" label="Setting" code={"Qwen3 8B int4 (OVMS NPU)"} />
          </li>

          <li>
            <p>
              The first response can be considerably slower because OpenVINO
              may still be compiling and caching portions of the model.
            </p>
          </li>
        </ol>

        <h4>OpenWork With NoLlama</h4>

        <ol>
          <li>
            <p>Start NoLlama:</p>

            <CodeBlock kind="command" code={".\\start.ps1"} />
          </li>

          <li>
            <p>Find the model ID exposed by NoLlama:</p>

            <CodeBlock kind="command" code={"curl http://localhost:8000/v1/models"} />
          </li>

          <li>
            <p>
              Configure OpenWork using the same OpenAI-compatible provider,
              replacing the model ID with the ID returned by NoLlama:
            </p>

            <CodeBlock kind="config" label="JSON configuration" code={`{
  "$schema": "https://opencode.ai/config.json",
  "disabled_providers": [
    "opencode"
  ],
  "provider": {
    "nollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NoLlama Local",
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "nollama-local"
      },
      "models": {
        "YOUR-MODEL-ID": {
          "name": "NoLlama Local Model",
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
  "model": "nollama/YOUR-MODEL-ID"
}`} />
          </li>
        </ol>

        <h4>OpenWork Troubleshooting</h4>

        <ul>
          <li>
            <strong>HTTP 404</strong>
            <p>
              Make sure the model name in <code>opencode.jsonc</code> exactly
              matches the model exposed by the backend.
            </p>

            <p>
              For OVMS, the OpenWork model ID must match{" "}
              <code>--model_name</code>, including capitalization.
            </p>
          </li>

          <li>
            <strong>Model does not appear</strong>
            <p>
              Completely restart OpenWork after changing{" "}
              <code>opencode.jsonc</code>.
            </p>
          </li>

          <li>
            <strong>Tools are not working correctly</strong>
            <p>
              Make sure OVMS was started with a tool parser compatible with the
              model, such as:
            </p>

            <CodeBlock kind="command" code={"--tool_parser hermes3"} />
          </li>
        </ul>

        <hr />

        <h3 id="claude-code">Claude Code</h3>

        <p>
          Claude Code is slightly different from OpenWork.
        </p>

        <p>
          OVMS and NoLlama expose an OpenAI-compatible API. Claude Code,
          however, normally communicates using Anthropic&apos;s Messages API.
        </p>

        <p>
          Because the protocols are different, Claude Code cannot simply be
          pointed directly at:
        </p>

        <CodeBlock kind="config" label="Setting" code={"http://localhost:8000/v1"} />

        <p>
          Instead, I use Claude Code Router as a local compatibility layer:
        </p>

        <CodeBlock kind="diagram" code={`Claude Code
     |
     | Anthropic Messages API
     v
Claude Code Router
http://127.0.0.1:3456
     |
     | OpenAI-compatible Chat API
     v
OVMS / NoLlama
http://127.0.0.1:8000/v1
     |
     v
Qwen
     |
     v
Intel NPU`} />

        <h4>Prerequisites</h4>

        <ul>
          <li>Node.js 22 or newer</li>
          <li>Claude Code</li>
          <li>Claude Code Router</li>
          <li>A running OVMS or NoLlama server</li>
        </ul>

        <h4>Install Claude Code</h4>

        <p>Check your Node.js version:</p>

        <CodeBlock kind="command" code={"node --version"} />

        <p>Install Claude Code:</p>

        <CodeBlock kind="command" code={"npm install -g @anthropic-ai/claude-code"} />

        <p>Install Claude Code Router:</p>

        <CodeBlock kind="command" code={"npm install -g @musistudio/claude-code-router"} />

        <h4>Claude Code With OVMS</h4>

        <ol>
          <li>
            <p>
              Start OVMS using the same Qwen3 configuration:
            </p>

            <CodeBlock kind="command" label="Windows CMD" code={`ovms.exe ^
  --rest_port 8000 ^
  --model_repository_path "%USERPROFILE%\\Downloads\\models" ^
  --source_model OpenVINO/Qwen3-8B-int4-cw-ov ^
  --model_name Qwen3-8B ^
  --task text_generation ^
  --target_device NPU ^
  --tool_parser hermes3 ^
  --max_prompt_len 16384 ^
  --plugin_config "{\\"NPUW_LLM_PREFILL_ATTENTION_HINT\\":\\"PYRAMID\\"}" ^
  --cache_dir .ovcache`} />
          </li>

          <li>
            <p>Make sure the model loaded:</p>

            <CodeBlock kind="command" code={"curl http://localhost:8000/v3/models"} />
          </li>

          <li>
            <p>Start the Claude Code Router configuration interface:</p>

            <CodeBlock kind="command" code={"ccr ui"} />
          </li>

          <li>
            <p>
              Open the Claude Code Router configuration UI if it did not open
              automatically:
            </p>

            <CodeBlock kind="config" label="Setting" code={"http://127.0.0.1:3458"} />
          </li>

          <li>
            <p>
              Go to the provider configuration and add a custom provider for
              OVMS.
            </p>

            <CodeBlock kind="config" label="Setting" code={`Name: OVMS Local

API Endpoint:
http://127.0.0.1:8000/v1

API Key:
ovms-local

Protocol:
OpenAI Chat

Model:
Qwen3-8B`} />
          </li>

          <li>
            <p>
              If Claude Code Router automatically detects the wrong protocol,
              disable automatic protocol detection and explicitly select:
            </p>

            <CodeBlock kind="config" label="Setting" code={"OpenAI Chat"} />
          </li>

          <li>
            <p>Run the provider connection test.</p>

            <p>
              A successful response means Claude Code Router can communicate
              with OVMS.
            </p>
          </li>

          <li>
            <p>Save the provider.</p>
          </li>

          <li>
            <p>
              In Claude Code Router, create a local API/client key if your
              configuration requires one.
            </p>

            <p>
              This does not need to be a real Anthropic API key. It is simply
              used by the local router.
            </p>
          </li>

          <li>
            <p>Start the Claude Code Router server.</p>

            <p>Its local gateway normally runs at:</p>

            <CodeBlock kind="config" label="Setting" code={"http://127.0.0.1:3456"} />
          </li>

          <li>
            <p>
              Create or select a Claude Code profile that uses the OVMS Local
              provider and <code>Qwen3-8B</code>.
            </p>
          </li>

          <li>
            <p>Launch Claude Code through Claude Code Router.</p>

            <CodeBlock kind="command" code={"ccr code"} />
          </li>

          <li>
            <p>Send a test message.</p>

            <p>The request path should now be:</p>

            <CodeBlock kind="diagram" code={`Claude Code
    ->
Claude Code Router
    ->
OVMS
    ->
Qwen3-8B
    ->
Intel NPU`} />
          </li>
        </ol>

        <h4>Claude Code With NoLlama</h4>

        <p>
          NoLlama uses the same basic Claude Code Router configuration because
          it also exposes an OpenAI-compatible server.
        </p>

        <ol>
          <li>
            <p>Start NoLlama:</p>

            <CodeBlock kind="command" code={".\\start.ps1"} />
          </li>

          <li>
            <p>Check which model IDs NoLlama exposes:</p>

            <CodeBlock kind="command" code={"curl http://localhost:8000/v1/models"} />
          </li>

          <li>
            <p>Add another provider in Claude Code Router:</p>

            <CodeBlock kind="config" label="Setting" code={`Name: NoLlama Local

API Endpoint:
http://127.0.0.1:8000/v1

API Key:
nollama-local

Protocol:
OpenAI Chat

Model:
YOUR-MODEL-ID`} />
          </li>

          <li>
            <p>
              Replace <code>YOUR-MODEL-ID</code> with the exact model ID
              returned by:
            </p>

            <CodeBlock kind="command" code={"curl http://localhost:8000/v1/models"} />
          </li>

          <li>
            <p>Test the provider and save it.</p>
          </li>

          <li>
            <p>
              Select the NoLlama provider/model in your Claude Code Router
              profile.
            </p>
          </li>

          <li>
            <p>Launch Claude Code through the router:</p>

            <CodeBlock kind="command" code={"ccr code"} />
          </li>
        </ol>

        <h4>Important: Claude Code vs Claude Desktop</h4>

        <p>
          This setup is specifically for <strong>Claude Code</strong>.
        </p>

        <p>
          The normal Claude website or Claude Desktop chat application does not
          provide a setting that simply replaces Anthropic&apos;s Claude model with
          an arbitrary OpenAI-compatible local LLM.
        </p>

        <p>
          Claude Desktop can use local MCP servers for tools and external
          information, but that is different from replacing Claude itself with
          Qwen running through OVMS.
        </p>

        <h4>Claude Code Troubleshooting</h4>

        <ul>
          <li>
            <strong>Claude Code still contacts Anthropic</strong>
            <p>
              Make sure Claude Code was launched through Claude Code Router
              rather than by running Claude normally.
            </p>

            <CodeBlock kind="command" code={"ccr code"} />
          </li>

          <li>
            <strong>HTTP 404 from OVMS</strong>
            <p>
              The router&apos;s model name must exactly match the OVMS model name.
            </p>

            <p>For this example:</p>

            <CodeBlock kind="command" code={`--model_name Qwen3-8B

Model in Claude Code Router:
Qwen3-8B`} />
          </li>

          <li>
            <strong>Normal chat works but tools fail</strong>
            <p>
              This normally means the base model request is working but tool
              call serialization or parsing is not.
            </p>

            <p>
              Make sure OVMS was started with the appropriate tool parser:
            </p>

            <CodeBlock kind="command" code={"--tool_parser hermes3"} />
          </li>

          <li>
            <strong>Very slow first response</strong>
            <p>
              The first request after starting OVMS may require OpenVINO to
              compile the model for the NPU. The compiled model cache helps
              reduce this on later launches.
            </p>

            <CodeBlock kind="command" code={"--cache_dir .ovcache"} />
          </li>
        </ul>

        <hr />

        <h2 id="final-setup">Final Setup</h2>

        <p>
          The entire local setup ends up looking roughly like this:
        </p>

        <h3>OpenWork</h3>

        <CodeBlock kind="diagram" code={`OpenWork
   |
   | OpenAI-compatible API
   v
OVMS / NoLlama
   |
   v
OpenVINO
   |
   v
Intel AI Boost NPU`} />

        <h3>Claude Code</h3>

        <CodeBlock kind="diagram" code={`Claude Code
   |
   | Anthropic Messages API
   v
Claude Code Router
   |
   | OpenAI-compatible API
   v
OVMS / NoLlama
   |
   v
OpenVINO
   |
   v
Intel AI Boost NPU`} />

        <p>
          This gives me a small local model for background tasks, basic coding
          work, tool calls, and agent workflows without burning Claude tokens
          or occupying the laptop&apos;s RTX GPU.
        </p>
        <VerificationNotes />
    </ArticleShell>
    </SiteLayout>
  );
}
