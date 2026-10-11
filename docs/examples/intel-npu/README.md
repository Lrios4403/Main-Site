# Intel NPU companion examples — local draft v0.1

These files are review material inside the website repository. No separate companion repository has been published or linked from the article. They are **templates, not hardware-tested results**.

## Before running

Record the exact OVMS release, Windows build, processor/NPU, driver version, model revision and model preparation log in a copy of `environment.example.json`. Compare commands to the documentation shipped with that release.

1. Install the driver and OVMS using the article's references; initialize the environment in your terminal.
2. Prepare the model with the first-download procedure for your release. The [OpenVINO 2026 NPU demo](https://docs.openvino.ai/2026/model-server/ovms_demos_llm_npu.html) separates preparation and serving. Do not assume the article's unversioned launch command downloads a missing model.
3. Copy the original launch command from the article into your own reviewed script. Its repository, prompt limit and plugin configuration require confirmation on your device. No new launch command is presented here as tested.
4. Run `check-inference.ps1` only after verifying its endpoint and model ID. It sends one local chat request. It does not prove NPU use or tool-call support.
5. Retain the response, server log and device-monitor evidence locally; redact user paths and any credentials before publishing evidence.

Example (PowerShell, not run during SEO checks):

```powershell
./check-inference.ps1 -Endpoint 'http://localhost:8000/v3/chat/completions' -Model 'Qwen3-8B'
```

`client.example.json` is a generic configuration worksheet, **not a drop-in OpenWork or Claude Code router config**. Their documented version-specific examples remain in the article. API discovery, chat, device execution and tool calls must each be checked independently.

Publishing a companion repository, pinning a known-working release, and adding screenshots await owner review and real test evidence.
