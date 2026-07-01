// scripts/genera-immagine-prova.mjs  (batch v3 - mix di registri)
// Prova (MVP4/B1): dimostra che l'immagine si adatta al TIPO di articolo.
// 3 topic reali da topics.json, 3 registri diversi. Salva prova-1..3.png.
// NON tocca WordPress. Da rimuovere dopo la valutazione.

import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("Manca OPENAI_API_KEY nei Secret."); process.exit(1); }

// Realismo fotografico costante (leva fissa in codice).
const STILE =
  "Fotografia editoriale fotorealistica, reflex full-frame 35mm, obiettivo 50mm f/1.8, luce naturale, profondita di campo ridotta, momento candido e non in posa, leggera grana pellicola, texture e imperfezioni realistiche. Niente testo, loghi o watermark. Eventuali volti non in primo piano.";

// 3 topic reali + registro adatto (in produzione lo sceglie Claude).
const BRIEF = [
  // sostituzione-caldaia-pompa-di-calore-villa -> INSTALLAZIONE
  "Un installatore in tuta da lavoro sta montando l'unita esterna di una moderna pompa di calore aria-acqua sulla parete esterna di una villa italiana. Inquadratura sul gesto e sulle mani, attrezzi da lavoro, cantiere ordinato, giornata di sole. Taglio documentaristico concreto e professionale.",
  // quanto-si-risparmia -> COMFORT / VENDITA
  "Interno di una casa italiana calda e accogliente in inverno: divano con plaid morbido, luce soffusa, tazza fumante, piante. Atmosfera di comfort e serenita, anche economica. Nessuna persona in primo piano.",
  // esco-certificata -> FIDUCIA / PROFESSIONALE
  "Due tecnici professionisti, a media distanza, controllano un impianto termico moderno in un locale tecnico pulito e ben illuminato. Atmosfera competente, affidabile, professionale. Focus sull'ambiente e sul lavoro."
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
