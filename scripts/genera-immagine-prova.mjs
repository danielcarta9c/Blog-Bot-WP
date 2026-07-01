// scripts/genera-immagine-prova.mjs
// Prova one-off (MVP4/B1): genera 3 immagini "hero" orientate all'emozione/
// vendita (non al prodotto), con stile fotografico realistico. Le salva in
// ops/out/prova-1..3.png. NON tocca WordPress. Da rimuovere dopo la valutazione.

import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("Manca OPENAI_API_KEY nei Secret."); process.exit(1); }

// Stile fotografico costante (leva "realismo + coerenza", fissata in codice).
const STILE =
  "Fotografia editoriale lifestyle fotorealistica, scattata con reflex full-frame 35mm, obiettivo 50mm f/1.8, luce naturale morbida da finestra, profondità di campo ridotta, momento candido e non in posa, leggera grana pellicola, texture e imperfezioni realistiche, casa italiana calda e accogliente, premium ma autentica. Niente testo, niente loghi, niente watermark. Persone solo di spalle o a media distanza, mai volti in primo piano.";

// Brief "emozionali" (leva "varieta + pertinenza"): 3 angoli diversi.
const BRIEF = [
  "Salotto moderno italiano in inverno, coperta morbida sul divano, una mano che regge una tazza calda, piante, fuori dalla finestra fa freddo: senso di comfort e calore domestico.",
  "Luminoso ambiente cucina-soggiorno italiano al mattino, atmosfera familiare rilassata, luce del sole, senso di calma e serenita (anche economica), casa ordinata e benessere.",
  "Elegante facciata di un condominio residenziale italiano moderno all'imbrunire, luci calde alle finestre, architettura pulita, atmosfera serale aspirazionale ma realistica."
];

async function genOne(prompt, i) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1536x1024", quality: "high", n: 1 })
  });
  const text = await res.text();
  if (!res.ok) { console.error(`Immagine ${i}: OpenAI ${res.status}: ${text.slice(0, 300)}`); return false; }
  const b64 = JSON.parse(text).data?.[0]?.b64_json;
  if (!b64) { console.error(`Immagine ${i}: nessun b64.`); return false; }
  writeFileSync(`ops/out/prova-${i}.png`, Buffer.from(b64, "base64"));
  console.log(`Immagine ${i} salvata: ops/out/prova-${i}.png`);
  return true;
}

mkdirSync("ops/out", { recursive: true });
let ok = 0;
for (let i = 0; i < BRIEF.length; i++) {
  if (await genOne(`${BRIEF[i]} ${STILE}`, i + 1)) ok++;
}
console.log(`Fatte ${ok}/${BRIEF.length} immagini.`);
if (ok === 0) process.exit(1);
