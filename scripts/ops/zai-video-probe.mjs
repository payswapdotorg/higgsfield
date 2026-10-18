// TL ops probe: zai SDK video generation (image-to-video) — writes result to /tmp/zai-video-probe.log
import ZAI from "z-ai-web-dev-sdk";
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); };
try {
  const zai = await ZAI.create();
  // character-ish portrait as base64 data URI from the earlier red-circle test
  const img = process.argv[2];
  const body = { prompt: "the circle gently pulses and drifts upward, smooth motion", quality: "speed", duration: 5 };
  if (img) body.image_url = img.startsWith("http") ? img : `data:image/jpeg;base64,${img}`;
  log("submitting video generation…");
  const t0 = Date.now();
  const r = await zai.video.generations.create(body);
  log(`submitted: ${JSON.stringify(r)}`);
  const id = r.id || r.request_id;
  for (let i = 0; i < 90; i++) {
    await new Promise((res) => setTimeout(res, 5000));
    const q = await zai.async.result.query(id);
    const st = q.task_status;
    if (i % 4 === 0) log(`poll ${i}: ${st}`);
    if (st === "SUCCESS" || st === "FAIL") {
      log(`FINAL ${st} after ${Date.now() - t0}ms: ${JSON.stringify(q).slice(0, 600)}`);
      process.exit(0);
    }
  }
  log("TIMEOUT after 450s");
} catch (e) {
  log(`ERROR: ${String(e).slice(0, 500)}`);
}
