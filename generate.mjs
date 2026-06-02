// generate.mjs — NoveC SEO Blog
//
// Replica in un singolo script Node del workflow n8n "NoveC SEO Blog - v2"
// (vedi `n8nesistente`). Gira da GitHub Actions una volta a settimana e crea
// un articolo come BOZZA su WordPress. Nessuna pubblicazione automatica.
//
// MVP1:   7 nodi n8n replicati, MENO la notifica email (-> MVP2).
// MVP1.1: lista argomenti editabile in topics.json (C1) + override one-off
//         in next.json, consumato e svuotato dopo il run (C2).
// Stack: solo `fetch` nativo (Node 20+), nessuna dipendenza npm.
//
// Segreti letti da env (GitHub Secrets):
//   ANTHROPIC_API_KEY, BRAVE_API_KEY, WP_USER, WP_APP_PASSWORD

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TOPICS_PATH = join(ROOT, "topics.json");
const NEXT_PATH = join(ROOT, "next.json");

const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");
const BRAVE_API_KEY = requireEnv("BRAVE_API_KEY");
const WP_USER = requireEnv("WP_USER");
const WP_APP_PASSWORD = requireEnv("WP_APP_PASSWORD");

const WP_BASE = "https://nove-c.com";
const MODEL = "claude-sonnet-4-6";
// Template del post (Attributi articolo -> Template = "Blog Post (Nuovo)").
// Valore = filename del template come esposto dalla REST API WP.
const WP_POST_TEMPLATE = "single-blog-nuovo.php";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Manca il secret ${name}. Configuralo in Settings -> Secrets -> Actions.`);
    process.exit(1);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Slug da una frase: minuscolo, senza accenti/punteggiatura, trattini.
// ---------------------------------------------------------------------------
function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60)
    .replace(/-+$/, "");
}

// Legge l'override one-off da next.json. Ritorna null se assente o senza titolo.
function readOverride() {
  try {
    const ov = JSON.parse(readFileSync(NEXT_PATH, "utf8"));
    if (ov && typeof ov.titolo === "string" && ov.titolo.trim()) return ov;
  } catch {
    // next.json mancante o malformato -> nessun override
  }
  return null;
}

// Svuota next.json dopo aver consumato l'override (preserva le note di aiuto).
function clearOverride() {
  const stub = {
    _leggimi:
      "Compila i 4 campi sotto per forzare UN articolo specifico (es. una novità), poi committa su main: parte un run con quel titolo. A run riuscito il file si SVUOTA da solo e torna la rotazione. Lascia 'titolo' vuoto = rotazione normale. Le righe che iniziano con _ sono solo note di aiuto: non vengono lette dallo script, non toccarle.",
    titolo: "",
    _aiuto_titolo:
      "Titolo H1 dell'articolo. Metti una power word (Guida, Conviene, Completa, Definitiva...) e la parola chiave. {{year}} diventa l'anno corrente. Es: Elettrificazione dei Carichi con Pompa di Calore: Perche Conviene {{year}}",
    focus_keyword: "",
    _aiuto_focus_keyword:
      "La frase chiave SEO esatta, 2-4 parole, quella per cui vuoi posizionarti su Google. Es: elettrificazione dei carichi",
    brief: "",
    _aiuto_brief:
      "Il taglio/tesi dell'articolo in 2-4 frasi: cosa deve sostenere e quali punti toccare. Piu sei specifico, meglio scrive Claude.",
    stile: "",
    _aiuto_stile:
      "Schema del testo. Valori possibili: problem-solution (problema -> soluzione) | how-to-guide (guida a step operativi) | faq-driven (tutto domande e risposte) | numbers-first (costruito su numeri/bollette/cifre) | comparison (confronti X vs Y). Vuoto = problem-solution."
  };
  writeFileSync(NEXT_PATH, JSON.stringify(stub, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// NODO: "Code in JavaScript - Topic" — rotazione settimanale topic + template.
// MVP1.1: topic/template letti da topics.json; se next.json ha un titolo,
//         quello vince (override one-off).
// ---------------------------------------------------------------------------
function selectTopic() {
  const data = JSON.parse(readFileSync(TOPICS_PATH, "utf8"));
  const topics = data.topics;
  const stili = data.stili;

  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = Math.floor((now - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  const today = now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

  const ov = readOverride();
  if (ov) {
    const focusKeyword = (ov.focus_keyword || "").trim() || ov.titolo.trim();
    const topic = {
      slug: slugify(focusKeyword),
      focusKeyword,
      title: ov.titolo.replace("{{year}}", year).trim(),
      angle: (ov.brief || "").trim() || `Approfondimento specifico richiesto dalla redazione: ${ov.titolo.trim()}`
    };
    const template =
      stili.find((s) => s.name === (ov.stile || "").trim()) || stili[0];
    return { topic, template, year, weekNumber, today, override: true };
  }

  const topic = { ...topics[weekNumber % topics.length] };
  const template = stili[weekNumber % stili.length];
  topic.title = topic.title.replace("{{year}}", year);
  return { topic, template, year, weekNumber, today, override: false };
}

// ---------------------------------------------------------------------------
// NODO: "HTTP Request" — Brave Search per contesto aggiornato
// ---------------------------------------------------------------------------
async function braveSearch(topic, year) {
  const params = new URLSearchParams({
    q: `${topic.focusKeyword} ${year} GSE normativa aggiornamenti`,
    count: "5",
    country: "IT",
    search_lang: "it",
    freshness: "pm"
  });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      "Accept": "application/json",
      "X-Subscription-Token": BRAVE_API_KEY
    }
  });
  if (!res.ok) {
    throw new Error(`Brave Search ha risposto ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// NODO: "Message a model" — generazione articolo con Claude
// ---------------------------------------------------------------------------
function buildPrompt(ctx, braveResults) {
  const t = ctx.topic;
  return `[ISTRUZIONI DI SISTEMA]
Sei un SEO copywriter esperto di Conto Termico 3.0 (D.M. 7 agosto 2025) per Nove C Ingegneria, ESCo certificata UNI CEI 11352 ed EPC Contractor. Scrivi SEMPRE e SOLO riferendoti al Conto Termico 3.0 (NON 2.0 che e superato). Usa interpretazione restrittiva della normativa. Output JSON stretto, nessun testo extra. Privilegia articoli riferiti all'ambito Privati (appartamenti, ville  e Condomini)

[TASK]
Oggi e ${ctx.today}.

Argomento: ${t.angle}
Focus keyword: ${t.focusKeyword}
Titolo H1 proposto: ${t.title}
Template strutturale: ${ctx.template.name}
Struttura: ${ctx.template.structure}
Tono: ${ctx.template.tone}

Ricerca Brave (usa SOLO per contesto aggiornato, NON copiare):
${JSON.stringify(braveResults)}

Scrivi un articolo di 1500-2000 parole in HTML puro (solo tag ammessi: p, h2, strong, em, ul, li, a). Negli attributi HTML usa pure le normali virgolette doppie (es: <a href="https://url">): l'output passa da un tool strutturato, quindi non ci sono problemi di escaping.

Requisiti SEO TASSATIVI:
- Focus keyword ESATTA "${t.focusKeyword}" nel primo paragrafo (primi 100 caratteri)
- Focus keyword in almeno 2 H2 su 5-6 totali
- DENSITA FOCUS KEYWORD: la focus keyword esatta deve comparire almeno 12-18 volte nel testo (target 0.8-1.5%). Ripetila naturalmente in ogni sezione. Questo e CRITICO per il punteggio Rank Math.
- Almeno 4 H2 distinte
- 1 H2 "Domande frequenti" con 4-5 Q&A in <p><strong>...</strong></p>
- LINK ESTERNI OBBLIGATORI: inserisci almeno 2 link esterni dofollow a fonti istituzionali autorevoli. Usa <a href="URL">testo ancora</a> (SENZA rel="nofollow"). Fonti consigliate: https://www.gse.it (Portale GSE Conto Termico), https://www.mase.gov.it (Ministero Ambiente), https://www.gazzettaufficiale.it (Gazzetta Ufficiale per D.M.). Esempio: <a href="https://www.gse.it/servizi-per-te/conto-termico">portale Conto Termico del GSE</a>
- LINK INTERNI: inserisci almeno 2 link interni a pagine Nove C. Usa: <a href="https://nove-c.com/soluzioni/conto-termico-3-0-incentivi-fino-al-65-senza-anticipo/">scopri il servizio Conto Termico 3.0 di Nove C</a> e <a href="https://nove-c.com/chi-siamo/">Nove C Ingegneria ESCo certificata</a>
- CTA finale con riferimento a Nove C Ingegneria ESCo certificata e link alla pagina servizio
- Cita D.M. 7 agosto 2025, articoli rilevanti, stato corrente Portaltermico GSE
- NON citare anni precedenti all'anno corrente come "attuali"
- TITOLO SEO (campo titolo_seo): deve INIZIARE con la focus keyword esatta "${t.focusKeyword}" e contenere una "power word" persuasiva (Guida, Completa, Definitiva, Conviene, Risparmi, Novita...). Esempio: "${t.focusKeyword}: Guida Completa".
- META DESCRIPTION (campo meta_description): 150-160 caratteri e DEVE contenere la focus keyword esatta "${t.focusKeyword}", preferibilmente all'inizio.
- SLUG: deve contenere la focus keyword completa separata da trattini, max 60 caratteri

Per restituire l'articolo CHIAMA il tool "pubblica_articolo" compilando TUTTI i suoi campi. La focus_keyword deve essere esattamente "${t.focusKeyword}" e l'h1 esattamente "${t.title}". Non scrivere altro testo fuori dal tool.`;
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      // A1: forziamo l'output strutturato via tool use -> niente parsing
      // fragile del testo (addio regex sulle virgolette).
      tools: [
        {
          name: "pubblica_articolo",
          description: "Restituisce l'articolo SEO completo, pronto per la bozza WordPress.",
          input_schema: {
            type: "object",
            properties: {
              titolo_seo: { type: "string", description: "Titolo SEO che INIZIA con la focus keyword esatta e contiene una power word (Guida, Completa, Conviene...)" },
              focus_keyword: { type: "string", description: "Focus keyword esatta" },
              meta_description: { type: "string", description: "Meta description 150-160 caratteri che CONTIENE la focus keyword esatta, preferibilmente all'inizio" },
              slug: { type: "string", description: "Slug con la focus keyword, max 60 caratteri" },
              estratto: { type: "string", description: "Estratto 120-160 caratteri" },
              h1: { type: "string", description: "Titolo H1" },
              content_html: { type: "string", description: "Corpo dell'articolo in HTML puro (solo tag p, h2, strong, em, ul, li, a)" }
            },
            required: ["titolo_seo", "focus_keyword", "meta_description", "slug", "estratto", "h1", "content_html"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "pubblica_articolo" },
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    throw new Error(`Anthropic ha risposto ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Garanzie SEO su titolo e meta (Rank Math). Il modello a volte non mette la
// focus keyword nel titolo SEO / meta: qui lo forziamo in modo deterministico.
// NB: ottimizziamo SOLO il titolo SEO (tag <title>), non il titolo visibile.
// ---------------------------------------------------------------------------
const POWER_WORDS = ["guida", "completa", "definitiva", "essenziale", "esclusiva", "vantaggi", "risparmi", "risparmiare", "segreti", "novità", "novita", "conviene", "scopri", "quanto"];
function hasPowerWord(s) {
  const l = (s || "").toLowerCase();
  return POWER_WORDS.some((p) => l.includes(p));
}
function capFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
// Titolo SEO con focus keyword all'inizio + una power word.
function buildSeoTitle(titoloSeo, focusKw) {
  const year = new Date().getFullYear();
  let t = (titoloSeo || "").trim();
  const fk = (focusKw || "").trim();
  if (!fk) return t;
  if (!t.toLowerCase().startsWith(fk.toLowerCase())) {
    t = t ? `${capFirst(fk)}: ${t}` : `${capFirst(fk)} ${year}`;
  }
  if (!hasPowerWord(t)) {
    t = `${t} - Guida ${year}`;
  }
  return t;
}
// Meta description con focus keyword garantita (150-160 char).
function ensureKwInMeta(meta, focusKw) {
  const fk = (focusKw || "").trim();
  let m = (meta || "").trim();
  if (!fk) return m;
  if (m.toLowerCase().includes(fk.toLowerCase())) return m;
  m = m ? `${capFirst(fk)}: ${m}` : `${capFirst(fk)}: la guida di Nove C Ingegneria.`;
  if (m.length > 160) m = m.slice(0, 157).trimEnd() + "...";
  return m;
}

// ---------------------------------------------------------------------------
// NODO: "Code in JavaScript" — estrae l'articolo dall'output strutturato + diagnostica SEO.
// A1 (MVP3): l'articolo arriva come tool_use.input gia' parsato dall'API,
// quindi niente piu' strip fence / swap virgolette / JSON.parse del testo.
// ---------------------------------------------------------------------------
function parseArticle(message) {
  const block = Array.isArray(message.content)
    ? message.content.find((b) => b.type === "tool_use" && b.name === "pubblica_articolo")
    : null;
  if (!block || !block.input) {
    throw new Error(
      "Claude non ha restituito il tool 'pubblica_articolo'. Risposta: " +
        JSON.stringify(message).substring(0, 300)
    );
  }
  const parsed = block.input;

  // Sanitize HTML
  let html = (parsed.content_html || "").trim();
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, "");
  html = html.replace(/<\/?(div|span|br|img|script|style|iframe|form)[^>]*>/gi, "");

  // SEO diagnostics
  const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText.split(" ").filter(Boolean).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const focusKw = parsed.focus_keyword || "";
  const kwRegex = focusKw ? new RegExp(focusKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : null;
  const kwCount = kwRegex ? (plainText.match(kwRegex) || []).length : 0;
  const first200 = plainText.substring(0, 200).toLowerCase();
  const kwInFirst = focusKw ? first200.includes(focusKw.toLowerCase()) : false;
  const kwDensity = wordCount > 0 ? (kwCount / wordCount * 100).toFixed(2) : "0.00";
  const extLinks = (html.match(/<a\s[^>]*href=["']https?:\/\/(?!nove-c\.com)[^"']+["'][^>]*>/gi) || []).length;
  const intLinks = (html.match(/<a\s[^>]*href=["']https?:\/\/nove-c\.com[^"']*["'][^>]*>/gi) || []).length;

  // Slug from focus keyword if too short
  let slug = parsed.slug || "";
  if (slug.length < 10 && focusKw) {
    slug = focusKw.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 60);
  }

  const ctaHtml = '<a href="https://nove-c.com/soluzioni/conto-termico-3-0-incentivi-fino-al-65-senza-anticipo/" style="font-weight:bold;">Contatta Nove C per una verifica di ammissibilita gratuita e scopri quanto puoi risparmiare con il Conto Termico 3.0</a>';

  // Garanzie SEO (Rank Math): titolo SEO keyword-led + power word, FK nella meta.
  const seoTitle = buildSeoTitle(parsed.titolo_seo, focusKw);
  const metaDescription = ensureKwInMeta(parsed.meta_description, focusKw);

  const patch_body = {
    status: "draft",
    title: parsed.titolo_seo || parsed.h1 || "Articolo Nove C",
    slug: slug,
    template: WP_POST_TEMPLATE,
    categories: [3],
    featured_media: 5026,
    excerpt: metaDescription,
    acf: {
      titoli: { titolo_h2: "", testo: html, testo_call_to_action: ctaHtml },
      estratto: parsed.estratto || metaDescription
    }
  };

  return {
    titolo_seo: patch_body.title,
    seo_title: seoTitle,
    focus_keyword: focusKw,
    meta_description: metaDescription,
    slug: slug,
    patch_body: patch_body,
    diagnostics: {
      wordCount, h2Count, kwCount, kwInFirst, kwDensity, extLinks, intLinks,
      warnings: [
        wordCount < 1500 ? "Word count basso: " + wordCount : null,
        h2Count < 4 ? "H2 insufficienti: " + h2Count : null,
        !kwInFirst ? "FK assente nei primi 200 char" : null,
        (parseFloat(kwDensity) < 0.5 || parseFloat(kwDensity) > 2.5) ? "Densita: " + kwDensity + "%" : null,
        extLinks < 1 ? "No link esterni" : null,
        intLinks < 1 ? "No link interni" : null
      ].filter(Boolean)
    }
  };
}

// ---------------------------------------------------------------------------
// NODO: "Crea Post WordPress" — crea la bozza
// ---------------------------------------------------------------------------
function wpAuthHeader() {
  return "Basic " + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");
}

async function createDraft(patch_body) {
  const res = await fetch(`${WP_BASE}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": wpAuthHeader()
    },
    body: JSON.stringify(patch_body)
  });
  if (!res.ok) {
    throw new Error(`WordPress (crea post) ha risposto ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// NODO: "Rank Math updateMeta" — imposta i meta SEO
// ---------------------------------------------------------------------------
async function updateRankMath(postId, article) {
  const res = await fetch(`${WP_BASE}/wp-json/rankmath/v1/updateMeta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": wpAuthHeader()
    },
    body: JSON.stringify({
      objectType: "post",
      objectID: postId,
      meta: {
        rank_math_focus_keyword: article.focus_keyword,
        rank_math_title: `${article.seo_title} | Nove C`,
        rank_math_description: article.meta_description
      }
    })
  });
  if (!res.ok) {
    throw new Error(`Rank Math (updateMeta) ha risposto ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Orchestrazione
// ---------------------------------------------------------------------------
async function main() {
  const ctx = selectTopic();
  if (ctx.override) {
    console.log(`Override one-off (next.json): "${ctx.topic.title}"`);
  } else {
    console.log(`Topic settimana ${ctx.weekNumber} (rotazione): ${ctx.topic.focusKeyword}`);
  }
  console.log(`Template: ${ctx.template.name}`);

  const braveResults = await braveSearch(ctx.topic, ctx.year);
  console.log("Brave Search: ok");

  const message = await callClaude(buildPrompt(ctx, braveResults));
  console.log("Claude: articolo generato");

  const article = parseArticle(message);
  console.log("Diagnostica SEO:", JSON.stringify(article.diagnostics));

  const post = await createDraft(article.patch_body);
  console.log(`Bozza WordPress creata: id ${post.id}`);

  await updateRankMath(post.id, article);
  console.log("Rank Math: meta impostati");

  // Override consumato solo a run riuscito: svuota next.json (il workflow
  // committa il file ripulito). Su errore l'override resta per il retry.
  if (ctx.override) {
    clearOverride();
    console.log("Override consumato: next.json svuotato (torna in rotazione).");
  }

  console.log(`\nFatto. Bozza pronta per la revisione:`);
  console.log(`  Admin:     ${WP_BASE}/wp-admin/post.php?post=${post.id}&action=edit`);
  console.log(`  Anteprima: ${WP_BASE}/?p=${post.id}&preview=true`);
}

main().catch((err) => {
  console.error("ERRORE:", err.message);
  process.exit(1);
});
