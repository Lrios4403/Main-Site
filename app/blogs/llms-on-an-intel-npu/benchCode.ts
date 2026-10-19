// Generated from github.com/Lrios4403/Intel-Npu-Benchmarks at the commit below:
// the code behind each chart, shown under "Show the benchmark code".
// Excerpts are verbatim, with their line numbers in that commit.
import type { BenchCode } from "@/components/article/charts/ChartFigure";

const source = {
  repo: "https://github.com/Lrios4403/Intel-Npu-Benchmarks",
  commit: "29bdcbf38babaa130ead39fec63afb99ac6c5041",
};

export const benchCode = {
  speed: {
    ...source,
    run: [
      "python bench/bench.py ovms NPU",
      "python bench/bench.py ovms CPU",
      "python bench/bench.py ovms GPU.0",
      "python bench/bench.py ollama",
      "python bench/report.py"
    ],
    snippets: [
      {
        "file": "bench/bench.py",
        "start": 350,
        "end": 369,
        "note": "One cold request, then three runs each of a short, ~1k and ~4k-token prompt. The chart shows the medians.",
        "code": "def timed_suite(stream):\n    \"\"\"Cold first request, then RUNS x (short, medium, long). Returns runs + time windows.\"\"\"\n    runs = []\n    windows = {}\n    t0 = time.time()\n    cold = stream(prompt(\"short\", \"cold-0\"))\n    windows[\"cold_first\"] = (t0, time.time())\n    print(f\"  cold first request: ttft {cold['ttft_s']}s, {cold['decode_tps']} tok/s\", flush=True)\n    for size in (\"short\", \"medium\", \"long\"):\n        w0 = time.time()\n        for i in range(RUNS):\n            r = stream(prompt(size, f\"{size}-{i}-{time.time_ns()}\"))\n            r[\"size\"] = size\n            runs.append(r)\n            print(f\"  {size:6} #{i + 1}: prompt {r['prompt_tokens']} tok, ttft {r['ttft_s']}s, \"\n                  f\"prefill {r['prefill_tps']} tok/s, decode {r['decode_tps']} tok/s, \"\n                  f\"{r['completion_tokens']} tokens\", flush=True)\n        windows[size] = (w0, time.time())\n    windows[\"all_runs\"] = (windows[\"short\"][0], windows[\"long\"][1])\n    return cold, runs, windows"
      },
      {
        "file": "bench/bench.py",
        "start": 158,
        "end": 172,
        "note": "Tokens per second is the completion tokens after the first, divided by the time between the first and last streamed token.",
        "code": "def finish(start, first, last, end, chunks, usage, text):\n    prompt_tokens = (usage or {}).get(\"prompt_tokens\")\n    completion = (usage or {}).get(\"completion_tokens\") or chunks\n    ttft = (first - start) if first else None\n    decode_window = (last - first) if first and last and last > first else None\n    return {\n        \"prompt_tokens\": prompt_tokens,\n        \"completion_tokens\": completion,\n        \"chunks\": chunks,\n        \"ttft_s\": round(ttft, 3) if ttft else None,\n        \"decode_tps\": round((completion - 1) / decode_window, 2) if decode_window else None,\n        \"prefill_tps\": round(prompt_tokens / ttft, 1) if prompt_tokens and ttft else None,\n        \"total_s\": round(end - start, 3),\n        \"text\": text,\n    }"
      }
    ],
  },
  ttft: {
    ...source,
    run: [
      "python bench/bench.py ovms NPU",
      "python bench/bench.py ovms CPU",
      "python bench/bench.py ovms GPU.0",
      "python bench/bench.py ollama",
      "python bench/report.py"
    ],
    snippets: [
      {
        "file": "bench/bench.py",
        "start": 42,
        "end": 54,
        "note": "The three prompt sizes. Each request starts with a unique nonce so no server can reuse a cached prompt.",
        "code": "def context(target_tokens):\n    # ~95 tokens per numbered paragraph with Qwen's tokenizer\n    count = max(1, round(target_tokens / 95))\n    return \"\\n\\n\".join(f\"Section {i + 1}. {PARAGRAPH}\" for i in range(count))\n\n\ndef prompt(size, nonce):\n    head = f\"Benchmark request {nonce}.\"\n    if size == \"short\":\n        return f\"{head} Explain how a CPU cache works in about 200 words. /no_think\"\n    target = 1000 if size == \"medium\" else 4000\n    return (f\"{head}\\n\\n{context(target)}\\n\\n\"\n            \"Summarize the text above in detail in about 200 words. /no_think\")"
      },
      {
        "file": "bench/bench.py",
        "start": 76,
        "end": 117,
        "note": "Time to first token is measured on the client: from sending the request to the first streamed piece of text.",
        "code": "def stream_openai(port, path, model, text, max_tokens=MAX_TOKENS):\n    \"\"\"Streams a chat completion; returns client-side timings and token counts.\"\"\"\n    body = {\"model\": model, \"messages\": [{\"role\": \"user\", \"content\": text}],\n            \"max_tokens\": max_tokens, \"temperature\": 0, \"stream\": True,\n            \"stream_options\": {\"include_usage\": True}}\n    start = time.perf_counter()\n    conn, res = request(port, \"POST\", path, body)\n    if res.status == 400:\n        # Server without stream_options support: count streamed chunks instead\n        res.read(); conn.close()\n        body.pop(\"stream_options\")\n        start = time.perf_counter()\n        conn, res = request(port, \"POST\", path, body)\n    if res.status != 200:\n        raise RuntimeError(f\"HTTP {res.status}: {res.read()[:300]!r}\")\n    first = last = None\n    chunks, usage, out = 0, None, []\n    while True:\n        line = res.readline()\n        if not line:\n            break\n        line = line.strip()\n        if not line.startswith(b\"data:\"):\n            continue\n        data = line[5:].strip()\n        if data == b\"[DONE]\":\n            break\n        event = json.loads(data)\n        if event.get(\"usage\"):\n            usage = event[\"usage\"]\n        for choice in event.get(\"choices\") or []:\n            delta = choice.get(\"delta\") or {}\n            piece = (delta.get(\"content\") or \"\") + (delta.get(\"reasoning_content\") or \"\")\n            if piece:\n                now = time.perf_counter()\n                first = first or now\n                last = now\n                chunks += 1\n                out.append(piece)\n    conn.close()\n    end = time.perf_counter()\n    return finish(start, first, last, end, chunks, usage, \"\".join(out))"
      }
    ],
  },
  compile: {
    ...source,
    run: [
      "python bench/genai_bench.py sweep qwen8"
    ],
    snippets: [
      {
        "file": "bench/genai_bench.py",
        "start": 135,
        "end": 147,
        "note": "The prompt limits tested, with and without the PYRAMID hint.",
        "code": "QWEN8 = m(\"OpenVINO/Qwen3-8B-int4-cw-ov\")\nPYRAMID = {\"NPUW_LLM_PREFILL_ATTENTION_HINT\": \"PYRAMID\"}\nPLANS = {\n    # Prompt-limit sweep on the production model, plus the article's exact config\n    \"qwen8\": [\n        (\"qwen8-article\", QWEN8, \"NPU\", {\"MAX_PROMPT_LEN\": 1024, \"MIN_RESPONSE_LEN\": 1}, [\"short\", \"medium\", \"long\"]),\n        (\"qwen8-p1024\", QWEN8, \"NPU\", {\"MAX_PROMPT_LEN\": 1024, \"MIN_RESPONSE_LEN\": 256}, [\"short\", \"medium\"]),\n        (\"qwen8-p2048\", QWEN8, \"NPU\", {\"MAX_PROMPT_LEN\": 2048, \"MIN_RESPONSE_LEN\": 256}, [\"short\", \"medium\"]),\n        (\"qwen8-p4096\", QWEN8, \"NPU\", {\"MAX_PROMPT_LEN\": 4096, \"MIN_RESPONSE_LEN\": 256}, [\"short\", \"medium\", \"long\"]),\n        (\"qwen8-p16384\", QWEN8, \"NPU\", {\"MAX_PROMPT_LEN\": 16384, \"MIN_RESPONSE_LEN\": 256}, [\"short\", \"medium\", \"long\", \"xl\"]),\n        (\"qwen8-p16384-pyramid\", QWEN8, \"NPU\", {\"MAX_PROMPT_LEN\": 16384, \"MIN_RESPONSE_LEN\": 256, **PYRAMID},\n         [\"short\", \"medium\", \"long\", \"xl\"]),\n    ],"
      },
      {
        "file": "bench/genai_bench.py",
        "start": 171,
        "end": 199,
        "note": "Each limit gets an empty compile cache, then a cold load (the compile) and a warm load from that cache, each in its own process.",
        "code": "def sweep(plan):\n    for label, model_dir, device, config, sizes in PLANS[plan]:\n        out_path = os.path.join(HERE, f\"results-genai-{label}.json\")\n        if os.path.exists(out_path):\n            print(f\"skip {label} (done)\", flush=True)\n            continue\n        if not os.path.isdir(model_dir):\n            print(f\"skip {label}: {model_dir} missing\", flush=True)\n            continue\n        cache = os.path.join(CACHE_ROOT, label)\n        shutil.rmtree(cache, ignore_errors=True)\n        os.makedirs(cache)\n        full = {**config, \"CACHE_DIR\": cache}\n        record = {\"label\": label}\n        for warm in (False, True):\n            proc = subprocess.run([sys.executable, \"-u\", __file__, \"one\", label, model_dir, device,\n                                   json.dumps(full), \",\".join(sizes), \"warm\" if warm else \"cold\"],\n                                  capture_output=True, text=True, timeout=7200)\n            sys.stdout.write(proc.stdout.split(\"@@RESULT@@\")[0])\n            if \"@@RESULT@@\" not in proc.stdout:\n                record[\"cold\" if not warm else \"warm\"] = {\"crash\": (proc.stderr or proc.stdout)[-2000:],\n                                                          \"exit\": proc.returncode}\n                print(f\"  [{label}] process failed (exit {proc.returncode}): {(proc.stderr or '')[-400:]}\", flush=True)\n                break\n            res = json.loads(proc.stdout.split(\"@@RESULT@@\")[1])\n            record[\"warm\" if warm else \"cold\"] = res\n            if \"load_error\" in res:\n                print(f\"  [{label}] load error: {res['load_error'][:400]}\", flush=True)\n                break"
      },
      {
        "file": "bench/genai_bench.py",
        "start": 67,
        "end": 82,
        "note": "The compile time is how long LLMPipeline takes to load the model on the NPU.",
        "code": "def run_one(label, model_dir, device, config, sizes, warm):\n    import openvino_genai as ov_genai\n\n    result = {\"label\": label, \"model\": os.path.relpath(model_dir, MODELS), \"device\": device,\n              \"config\": config, \"warm\": warm, \"openvino_genai\": ov_genai.__version__}\n    t0 = time.perf_counter()\n    try:\n        # The article passes config positionally; GenAI 2026.4 deprecates that in favour of kwargs\n        pipe = ov_genai.LLMPipeline(model_dir, device, **config)\n    except Exception as error:\n        result[\"load_error\"] = str(error)[:2000]\n        result[\"load_s\"] = round(time.perf_counter() - t0, 1)\n        result[\"memory\"] = peak_memory()\n        return result\n    result[\"load_s\"] = round(time.perf_counter() - t0, 1)\n    print(f\"  [{label}{' warm' if warm else ''}] loaded in {result['load_s']}s\", flush=True)"
      }
    ],
  },
  cache: {
    ...source,
    run: [
      "python bench/cache_bench.py"
    ],
    snippets: [
      {
        "file": "bench/cache_bench.py",
        "start": 103,
        "end": 110,
        "note": "An agent-style session: the same long system prompt with a new question each turn.",
        "code": "def agent_turns(backend, size):\n    system = system_prompt(size)\n    rows = []\n    for i, question in enumerate(QUESTIONS):\n        r = request(backend, [{\"role\": \"system\", \"content\": system}, {\"role\": \"user\", \"content\": question + \" /no_think\"}])\n        rows.append({\"turn\": i + 1, **{k: v for k, v in r.items() if k != \"reply\"}})\n        print(f\"    agent {size} turn {i + 1}: ttft {r['ttft_s']}s {json.dumps({k: v for k, v in r.items() if k not in ('reply', 'ttft_s')})}\", flush=True)\n    return rows"
      },
      {
        "file": "bench/cache_bench.py",
        "start": 146,
        "end": 177,
        "note": "The four setups compared: the NPU with prefix caching on and off, the Intel iGPU, and the RTX through Ollama.",
        "code": "def main():\n    results = {}\n    model = \"OpenVINO/Qwen3-8B-int4-cw-ov\"\n    backend = {\"kind\": \"openai\", \"port\": 8000, \"model\": \"Qwen3-8B\"}\n\n    print(\"== NPU, prefix caching on (the post's config)\", flush=True)\n    with Ovms(model, \"Qwen3-8B\", \"NPU\", \"hermes3\", NPU_FLAGS + [\"--cache_dir\", \".ovcache\", \"--enable_prefix_caching\", \"true\"],\n              log_label=\"cache-npu-on\") as server:\n        graph = open(server.graph).read()\n        results[\"npu_prefix_on\"] = {\"startup_s\": server.startup_s, \"graph_prefix_lines\": [\n            l.strip() for l in graph.splitlines() if \"prefix\" in l.lower()],\n            **suite(backend, [(\"agent\", \"4k\"), (\"agent\", \"11k\"), (\"chat\", \"4k\"), (\"identical\", \"4k\")])}\n\n    print(\"== NPU, prefix caching off\", flush=True)\n    os.makedirs(SCRATCH_CACHE, exist_ok=True)\n    with Ovms(model, \"Qwen3-8B\", \"NPU\", \"hermes3\", NPU_FLAGS + [\"--cache_dir\", SCRATCH_CACHE, \"--enable_prefix_caching\", \"false\"],\n              log_label=\"cache-npu-off\") as server:\n        graph = open(server.graph).read()\n        results[\"npu_prefix_off\"] = {\"startup_s\": server.startup_s, \"graph_prefix_lines\": [\n            l.strip() for l in graph.splitlines() if \"prefix\" in l.lower()],\n            **suite(backend, [(\"agent\", \"4k\")])}\n\n    print(\"== Intel iGPU, prefix caching on\", flush=True)\n    with Ovms(model, \"Qwen3-8B\", \"GPU.0\", \"hermes3\", [\"--enable_prefix_caching\", \"true\"], log_label=\"cache-igpu\") as server:\n        results[\"igpu_prefix_on\"] = {\"startup_s\": server.startup_s,\n                                     **suite(backend, [(\"agent\", \"4k\"), (\"agent\", \"11k\"), (\"chat\", \"4k\")])}\n\n    print(\"== RTX 5080 (Ollama)\", flush=True)\n    rtx = {\"kind\": \"ollama\", \"port\": 11434, \"model\": \"qwen3:8b\"}\n    request(rtx, [{\"role\": \"user\", \"content\": \"hi /no_think\"}], max_tokens=1)  # load the model\n    results[\"rtx_ollama\"] = suite(rtx, [(\"agent\", \"4k\"), (\"agent\", \"11k\"), (\"chat\", \"4k\")])\n    subprocess.run([\"ollama\", \"stop\", \"qwen3:8b\"], capture_output=True)"
      }
    ],
  },
  stress: {
    ...source,
    run: [
      "python bench/stress_bench.py"
    ],
    snippets: [
      {
        "file": "bench/stress_bench.py",
        "start": 21,
        "end": 36,
        "note": "The CPU job: 24 processes hashing for 40 seconds. Its throughput is the “other work” number.",
        "code": "def burn(seconds):\n    end = time.perf_counter() + seconds\n    block = b\"x\" * 4096\n    count = 0\n    while time.perf_counter() < end:\n        hashlib.sha256(block).digest()\n        count += 1\n    return count\n\n\ndef stress():\n    with multiprocessing.Pool(WORKERS) as pool:\n        t0 = time.time()\n        counts = pool.map(burn, [SECONDS] * WORKERS)\n        t1 = time.time()\n    return round(sum(counts) / SECONDS / 1e6, 3), t0, t1  # million hashes per second"
      },
      {
        "file": "bench/stress_bench.py",
        "start": 47,
        "end": 62,
        "note": "For each device: LLM speed alone, then generating nonstop while the CPU job runs.",
        "code": "    for label, device, extra in [\n        (\"npu\", \"NPU\", [\"--max_prompt_len\", \"16384\", \"--plugin_config\",\n                        '{\"NPUW_LLM_PREFILL_ATTENTION_HINT\":\"PYRAMID\"}', \"--cache_dir\", \".ovcache\"]),\n        (\"cpu\", \"CPU\", []), (\"igpu\", \"GPU.0\", [])]:\n        with Ovms(\"OpenVINO/Qwen3-8B-int4-cw-ov\", \"Qwen3-8B\", device, \"hermes3\", extra, log_label=f\"stress-{label}\"):\n            alone = alone_speed(8000, \"/v3/chat/completions\", \"Qwen3-8B\")\n            loop = Loop(8000, \"/v3/chat/completions\", \"Qwen3-8B\")\n            loop.start()\n            time.sleep(10)\n            mhs, t0, t1 = stress()\n            loop.running = False\n            loop.join(timeout=300)\n            # Requests that finished during the stress window, or within 20 s after it\n            during = loop.between(t0 + 5, t1 + 20)\n        results[label] = {\"llm_alone_tps\": alone, \"llm_under_stress_tps\": during, \"stress_mhs\": mhs}\n        print(f\"{label}: {results[label]}\", flush=True)"
      },
      {
        "file": "bench/load_bench.py",
        "start": 75,
        "end": 95,
        "note": "The nonstop generation loop, which records each request's speed with its finish time.",
        "code": "class Loop(threading.Thread):\n    \"\"\"Generates continuously and records each request's decode speed with its end time.\"\"\"\n\n    def __init__(self, port, path, model, ollama=False):\n        super().__init__(daemon=True)\n        self.args = (port, path, model)\n        self.ollama = ollama\n        self.samples = []\n        self.running = True\n\n    def run(self):\n        i = 0\n        while self.running:\n            tps = stream(*self.args, medium_prompt(f\"load-{i}-{time.time_ns()}\"), ollama=self.ollama)\n            if tps:\n                self.samples.append((time.time(), tps))\n            i += 1\n\n    def between(self, t0, t1):\n        values = [v for t, v in self.samples if t0 <= t <= t1]\n        return round(statistics.median(values), 2) if values else None"
      }
    ],
  },
  memory: {
    ...source,
    run: [
      "powershell -ExecutionPolicy Bypass -File bench/monitor.ps1 -Out runs/latest/monitor.jsonl",
      "python bench/more_bench.py",
      "python bench/monitor_summary.py runs/latest/monitor.jsonl"
    ],
    snippets: [
      {
        "file": "bench/more_bench.py",
        "start": 202,
        "end": 209,
        "note": "Each server is started and left idle with the model loaded for three minutes.",
        "code": "    npu_flags = [\"--max_prompt_len\", \"16384\", \"--plugin_config\", '{\"NPUW_LLM_PREFILL_ATTENTION_HINT\":\"PYRAMID\"}',\n                 \"--cache_dir\", \".ovcache\"]\n    for label, device, flags in ((\"npu\", \"NPU\", npu_flags), (\"igpu\", \"GPU.0\", [])):\n        mark(f\"{label}:startup\")\n        with Ovms(\"OpenVINO/Qwen3-8B-int4-cw-ov\", \"Qwen3-8B\", device, \"hermes3\", flags, log_label=f\"more-{label}\") as server:\n            out = {\"startup_s\": server.startup_s}\n            backend = {\"kind\": \"openai\", \"port\": 8000, \"model\": \"Qwen3-8B\"}\n            idle(180, f\"{label}:idle (server loaded)\")"
      },
      {
        "file": "bench/monitor.ps1",
        "start": 31,
        "end": 49,
        "note": "The monitor (a second terminal) records adapter memory and the server process's RAM every ~2 seconds.",
        "code": "  foreach ($c in $s.CounterSamples) {\n    $p = ($c.Path.ToLower() -replace '^\\\\\\\\[^\\\\]+', '')\n    if ($p -match 'gpu engine\\(pid_\\d+_luid_0x[0-9a-f]+_(0x[0-9a-f]+)_phys_\\d+_eng_\\d+_engtype_([^)]*)\\)') {\n      $type = ($matches[2] -replace '#\\d+$', ''); if (-not $type) { $type = 'other' }\n      $key = \"$(Adapter $matches[1])|$type\"; $engines[$key] = [double]$engines[$key] + $c.CookedValue\n    } elseif ($p -match 'gpu adapter memory\\(luid_0x[0-9a-f]+_(0x[0-9a-f]+)_phys_\\d+\\)\\\\(dedicated|shared) usage') {\n      $adapterMem[\"$(Adapter $matches[1])|$($matches[2])\"] = [math]::Round($c.CookedValue / 1GB, 2)\n    } elseif ($p -match 'thermal zone information\\((.+)\\)') {\n      $temps[$matches[1]] = [math]::Round($c.CookedValue / 10 - 273.15, 1)  # tenths of a kelvin -> °C\n    } else {\n      $values[$p] = [math]::Round($c.CookedValue, 2)\n    }\n  }\n  $eng = @{}; foreach ($k in $engines.Keys) { if ($engines[$k] -gt 0.5) { $eng[$k] = [math]::Round($engines[$k], 1) } }\n  $procs = @{}\n  foreach ($n in 'ovms', 'ollama', 'python') {\n    $ps = Get-Process $n -ErrorAction SilentlyContinue\n    if ($ps) { $procs[$n] = [math]::Round((($ps | Measure-Object WorkingSet64 -Sum).Sum) / 1GB, 2) }\n  }"
      },
      {
        "file": "bench/monitor_summary.py",
        "start": 99,
        "end": 108,
        "note": "The chart uses the maximum for that idle phase.",
        "code": "        \"npu_shared_mem_gb_max\": stat(mem(\"npu|shared\"), max, 2),\n        \"igpu_shared_mem_gb_max\": stat(mem(\"igpu|shared\"), max, 2),\n        \"rtx\": {\"power_w_mean\": stat([num(r[\"rtx\"].get(\"power_w\")) for r in rows]),\n                \"power_w_max\": stat([num(r[\"rtx\"].get(\"power_w\")) for r in rows], max),\n                \"util_pct_mean\": stat([num(r[\"rtx\"].get(\"util_pct\")) for r in rows]),\n                \"vram_gb_max\": stat([num(r[\"rtx\"].get(\"vram_mb\")) and num(r[\"rtx\"][\"vram_mb\"]) / 1024 for r in rows], max, 2),\n                \"temp_c_max\": stat([num(r[\"rtx\"].get(\"temp_c\")) for r in rows], max)},\n        \"thermal_zone_c_max\": stat(temps, max),\n        \"ovms_ws_gb_max\": stat(proc(\"ovms\"), max, 2),\n        \"ollama_ws_gb_max\": stat(proc(\"ollama\"), max, 2),"
      }
    ],
  },
  thinking: {
    ...source,
    run: [
      "python bench/more_bench.py"
    ],
    snippets: [
      {
        "file": "bench/more_bench.py",
        "start": 119,
        "end": 137,
        "note": "Three tasks with thinking on and a 3,000-token cap. Time is to the finished answer.",
        "code": "THINK_TASKS = [\n    (\"bat and ball\", \"A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?\",\n     lambda r: any(s in r[\"reply\"].replace(\" \", \"\").lower() for s in (\"$0.05\", \"5cents\", \"0.05\", \"fivecents\"))),\n    (\"fibonacci code\", \"Write a Python function that returns the n-th Fibonacci number iteratively, with a docstring.\",\n     lambda r: \"def \" in r[\"reply\"]),\n    (\"tool call\", \"What's the weather in Phoenix right now?\", lambda r: r[\"tool_calls\"]),\n]\n\n\ndef thinking(backend, out):\n    rows = []\n    for name, text, check in THINK_TASKS:\n        tools = [WEATHER_TOOL] if name == \"tool call\" else None\n        r = request(backend, [{\"role\": \"user\", \"content\": text}], 3000, think=True, tools=tools)\n        r[\"task\"], r[\"ok\"] = name, (check(r) if \"error\" not in r else False)\n        rows.append(r)\n        print(f\"    thinking {name}: total {r.get('total_s')}s, first token {r.get('ttft_s')}s, \"\n              f\"{r.get('completion_tokens')} tokens, thinking {r.get('thinking_chars')} chars, ok={r['ok']}\", flush=True)\n    out[\"thinking\"] = rows"
      }
    ],
  },
  parallel: {
    ...source,
    run: [
      "python bench/more_bench.py"
    ],
    snippets: [
      {
        "file": "bench/more_bench.py",
        "start": 140,
        "end": 160,
        "note": "1, 2 and 4 requests sent at once. Combined speed is all output tokens divided by the wall time.",
        "code": "def parallel(backend, out):\n    rows = {}\n    for n in (1, 2, 4):\n        results = [None] * n\n        def worker(i):\n            results[i] = request(backend, [{\"role\": \"user\", \"content\": doc(9, f\"par{n}-{i}-{time.time_ns()}\")}], 128)\n        threads = [threading.Thread(target=worker, args=(i,)) for i in range(n)]\n        t0 = time.perf_counter()\n        for t in threads:\n            t.start()\n        for t in threads:\n            t.join()\n        wall = time.perf_counter() - t0\n        tokens = sum((r or {}).get(\"completion_tokens\") or 0 for r in results)\n        rows[str(n)] = {\"wall_s\": round(wall, 1), \"aggregate_tps\": round(tokens / wall, 2),\n                        \"per_request_total_s\": [r.get(\"total_s\") for r in results],\n                        \"per_request_ttft_s\": [r.get(\"ttft_s\") for r in results],\n                        \"errors\": [r[\"error\"] for r in results if r and \"error\" in r]}\n        print(f\"    parallel x{n}: wall {rows[str(n)]['wall_s']}s, aggregate {rows[str(n)]['aggregate_tps']} tok/s, \"\n              f\"per request {rows[str(n)]['per_request_total_s']}\", flush=True)\n    out[\"parallel\"] = rows"
      }
    ],
  },
} satisfies Record<string, BenchCode>;
