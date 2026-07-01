// scripts/genera-immagine-prova.mjs
// Prova one-off (MVP4/B1): genera un'immagine hero con OpenAI e la salva in
// ops/out/immagine-prova.png (poi il workflow la committa). Serve solo a
// valutare la resa. NON tocca WordPress. Da rimuovere dopo la valutazione.

import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("Manca OPENAI_API_KEY nei Secret."); process.exit(1); }

const prompt =
  "Fotografia architettonica professionale: unità esterna di una moderna pompa di calore aria-acqua montata sulla parete di una villa italiana contemporanea ed elegante, luce calda del tardo pomeriggio, composizione pulita e minimale, giardino curato, alta qualità, fotorealistica, stile editoriale, senza testo, senza loghi, senza persone.";

async function tryModel(body) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

let out = await tryModel({ model: "gpt-image-1", prompt, size: "1536x1024", n: 1 });
if (!out.ok) {
  console.error(`gpt-image-1 ha risposto ${out.status}: ${out.text.slice(0, 300)}`);
  console.error("Fallback su dall-e-3...");
  out = await tryModel({ model: "dall-e-3", prompt, size: "1792x1024", quality: "standard", response_format: "b64_json", n: 1 });
}
if (!out.ok) {
  console.error(`OpenAI immagini ha risposto ${out.status}: ${out.text.slice(0, 500)}`);
  process.exit(1);
}

const data = JSON.parse(out.text);
const b64 = data.data && data.data[0] && data.data[0].b64_json;
if (!b64) { console.error("Nessuna immagine b64 nella risposta."); process.exit(1); }

mkdirSync("ops/out", { recursive: true });
writeFileSync("ops/out/immagine-prova.png", Buffer.from(b64, "base64"));
console.log("Immagine salvata: ops/out/immagine-prova.png");
