// generate.mjs — NoveC SEO Blog
//
// Replica in un singolo script Node del workflow n8n "NoveC SEO Blog - v2"
// (vedi `n8nesistente`). Gira da GitHub Actions una volta a settimana e crea
// un articolo come BOZZA su WordPress. Nessuna pubblicazione automatica.
//
// MVP1: 7 nodi n8n replicati, MENO la notifica email (-> MVP2).
// Stack: solo `fetch` nativo (Node 20+), nessuna dipendenza npm.
//
// Segreti letti da env (GitHub Secrets):
//   ANTHROPIC_API_KEY, BRAVE_API_KEY, WP_USER, WP_APP_PASSWORD

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
// NODO: "Code in JavaScript - Topic" — rotazione settimanale topic + template
// ---------------------------------------------------------------------------
function selectTopic() {
  const topics = [
    // === MOTORE 1: VILLETTE CT 3.0 ===
    {
      slug: 'sostituzione-caldaia-pompa-di-calore-villa',
      focusKeyword: 'sostituzione caldaia con pompa di calore villa',
      title: 'Sostituire la Caldaia con una Pompa di Calore in Villa: Guida {{year}}',
      angle: 'Iter completo per villa indipendente: verifica fattibilità, dimensionamento, sostituzione del generatore, integrazione con i radiatori esistenti, sconto in fattura sempre garantito CT 3.0 fino a 15.000€. Il cliente paga solo il netto, l\'incentivo lo gestiamo noi. Tempistiche reali dalla firma all\'incasso (circa 2,5 mesi).'
    },
    {
      slug: 'pompa-di-calore-condominio-caldaia-centralizzata',
      focusKeyword: 'pompa di calore condominio caldaia centralizzata',
      title: 'Pompa di Calore in Condominio: Sostituire la Caldaia Centralizzata {{year}}',
      angle: 'Sostituzione della caldaia centralizzata con pompa di calore idronica in condominio, a Milano e a Roma. Iter assemblea condominiale, dimensionamento sui consumi reali (non su tabelle), integrazione con i radiatori esistenti, sconto in fattura applicato al condominio, ruolo dell\'amministratore nel processo. Casi reali nel milanese.'
    },
    {
      slug: 'sconto-in-fattura-pompa-di-calore-privati',
      focusKeyword: 'sconto in fattura pompa di calore',
      title: 'Sconto in Fattura Pompa di Calore: Cosa Paga Davvero il Cliente {{year}}',
      angle: 'Lo sconto in fattura sempre garantito da ESCo certificata: il cliente paga solo il netto, l\'incentivo GSE lo gestisce direttamente Nove C. Differenza tra sconto in fattura e cessione del credito, perché serve un Soggetto Responsabile certificato UNI CEI 11352, cosa anticipa il cliente e cosa no, in quanti giorni si chiude la pratica.'
    },
    {
      slug: 'pompa-di-calore-acqua-acqua-falda',
      focusKeyword: 'pompa di calore acqua-acqua falda',
      title: 'Pompa di Calore Acqua-Acqua con Acqua di Falda: Quando Conviene {{year}}',
      angle: 'Pompa di calore geotermica a ciclo aperto su falda. COP elevati e stabili tutto l\'anno (4,5-5,5), iter autorizzativo provinciale, costi dei pozzi vs risparmio energetico, applicazioni residenziali e per il terziario. Quando ha senso davvero a Roma e Milano (Pianura Padana, Lazio costiero).'
    },
    {
      slug: 'quanto-si-risparmia-pompa-di-calore-villa',
      focusKeyword: 'quanto si risparmia con la pompa di calore',
      title: 'Quanto si Risparmia Davvero con la Pompa di Calore in Villa {{year}}',
      angle: 'Confronto bolletta gas vs pompa di calore su villa 180-250 mq. COP stagionale reale, costo del kWh elettrico vs gas a tariffa attuale, payback con e senza CT 3.0, esempio numerico completo. Numeri-first: cifre prima, narrazione dopo.'
    },
    {
      slug: 'pompa-di-calore-condominio-centrale-termica-interrata',
      focusKeyword: 'pompa di calore condominio centrale termica interrata',
      title: 'Pompa di Calore in Condominio con Centrale Termica Interrata: Le Due Soluzioni {{year}}',
      angle: 'Quando la centrale termica condominiale è in un locale interrato e portare una dorsale fino alle unità esterne in copertura non è fattibile o non conviene, ci sono due soluzioni che funzionano davvero. Soluzione 1: piccole pompe di calore aria-acqua esterne abbinate a un booster acqua-acqua installato nella centrale interrata, che lavora a temperatura più alta verso i radiatori. Soluzione 2: pompe di calore aria-acqua installate direttamente nel locale interrato e canalizzate per gestire l\'aria di rinnovo e l\'espulsione. Quando scegliere l\'una o l\'altra, vincoli di rumorosità e ricambi d\'aria, sicurezza refrigerante (EN 378), sconto in fattura sempre garantito anche su queste configurazioni.'
    },
    {
      slug: 'fotovoltaico-pompa-di-calore-abbinamento-villa',
      focusKeyword: 'fotovoltaico e pompa di calore',
      title: 'Fotovoltaico e Pompa di Calore: l\'Abbinamento che Massimizza l\'Autoconsumo {{year}}',
      angle: 'Pompa di calore + fotovoltaico in villa: dimensionamento del FV in funzione del fabbisogno della PdC (3-6 kWp tipici), batteria sì o no, copertura annua reale, ritorno dell\'investimento combinato. Sconto in fattura CT 3.0 sulla pompa di calore + detrazione separata sul fotovoltaico. Cenno alle CER per chi non riesce ad autoconsumare tutto.'
    },
    {
      slug: 'pompa-di-calore-ibrida-perche-non-conviene',
      focusKeyword: 'pompa di calore ibrida non conviene',
      title: 'Perché la Pompa di Calore Ibrida Non Conviene Più: Il Full Electric è Sempre Possibile {{year}}',
      angle: 'L\'ibrido viene venduto come compromesso quando il full electric "non è fattibile". Non è vero. Tre problemi reali dell\'ibrido: il gas continua a costare tantissimo e tutto fa pensare che continuerà così; la logica di switch automatico in molti impianti reali finisce per privilegiare il gas più di quanto dovrebbe, vanificando il risparmio promesso; il cliente paga due generatori invece di uno e ne mantiene due. La soluzione full electric esiste sempre: pompe di calore aria-acqua più piccole, in cascata o in parallelo, abbinate a un booster acqua-acqua che usa il circuito delle aria-acqua come sorgente. Si raggiungono le temperature di mandata necessarie ai radiatori esistenti, senza bruciare un grammo di gas. Esempio reale e configurazione tipica.'
    },
    {
      slug: 'pompa-di-calore-piscine-strutture-sportive',
      focusKeyword: 'pompa di calore piscina',
      title: 'Pompa di Calore per Piscine e Strutture Sportive {{year}}',
      angle: 'Riscaldamento della vasca e dell\'acqua calda sanitaria degli spogliatoi con pompe di calore dedicate. Dimensionamento sul volume della vasca e sui ricambi d\'aria, deumidificazione integrata, abbinamento al fotovoltaico per coprire i consumi estivi. Incentivi disponibili per circoli e gestori sportivi, esempio di dimensionamento reale.'
    },
    {
      slug: 'esco-certificata-pompa-di-calore-perche',
      focusKeyword: 'ESCo certificata pompa di calore',
      title: 'Perché Affidare la Pompa di Calore a una ESCo Certificata {{year}}',
      angle: 'Differenza tra installatore, studio tecnico ed ESCo certificata UNI CEI 11352. Solo l\'ESCo può essere Soggetto Responsabile CT 3.0, gestire la pratica GSE in modo diretto e garantire al cliente lo sconto in fattura sempre, senza incertezze sui tempi del GSE. Cosa rischia il cliente che si affida a chi non è ESCo: incentivo non riconosciuto, lavori sospesi, costi imprevisti.'
    }
  ];
  const templates = [
    { name: 'problem-solution', structure: 'Intro con problema -> Contesto normativo / Cosa cambia / Chi puo accedere / Come si ottiene / Tempistiche / FAQ -> CTA', tone: 'consulenziale diretto' },
    { name: 'how-to-guide', structure: 'Intro -> Step 1 Verifica / Step 2 Diagnosi / Step 3 Progettazione / Step 4 Realizzazione / Step 5 Pratica GSE / Step 6 Incasso -> FAQ -> CTA', tone: 'operativo pratico' },
    { name: 'faq-driven', structure: 'Intro 3 domande -> 5 H2 risposta / Perche Nove C / FAQ / CTA', tone: 'domanda-risposta rassicurante' },
    { name: 'numbers-first', structure: 'Intro con cifre (900M, 65%, 100%, 35 kW, 15000EUR) -> 5 H2 con numeri / Esempio di calcolo / Nove C / FAQ / CTA', tone: 'data-driven autorevole' },
    { name: 'comparison', structure: 'Intro -> CT 2.0 vs 3.0 / Accesso diretto vs prenotazione / Privati vs PA / PdC vs ibrido vs biomassa / CT 3.0 vs altri -> Nove C / FAQ / CTA', tone: 'analitico comparativo' }
  ];
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = Math.floor((now - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  const topic = { ...topics[weekNumber % topics.length] };
  const template = templates[weekNumber % templates.length];
  topic.title = topic.title.replace('{{year}}', year);
  return { topic, template, year, weekNumber, today: now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) };
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

Scrivi un articolo di 1500-2000 parole in HTML puro (solo tag ammessi: p, h2, strong, em, ul, li, a). IMPORTANTE: negli attributi HTML usa SOLO apici singoli (es: <a href='https://url'>), MAI virgolette doppie, perche l'output e JSON e le virgolette doppie rompono il parsing.

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
- TITOLO SEO: deve contenere una "power word" persuasiva (es: Guida, Completa, Definitiva, Essenziale, Esclusiva, Vantaggi, Risparmi, Segreti, Novita). Questo migliora il CTR.
- SLUG: deve contenere la focus keyword completa separata da trattini, max 60 caratteri

Rispondi SOLO con JSON valido (NO markdown, NO code fence, NO testo prima o dopo):
{
 "titolo_seo": "...",
 "focus_keyword": "${t.focusKeyword}",
 "meta_description": "... (150-160 char, con focus keyword)",
 "slug": "...",
 "estratto": "... (120-160 char per ACF estratto)",
 "h1": "${t.title}",
 "content_html": "<p>...</p><h2>...</h2>..."
}`;
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
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    throw new Error(`Anthropic ha risposto ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// NODO: "Code in JavaScript" — parsing output Claude + diagnostica SEO
// (logica replicata fedelmente dal workflow n8n; A1 robustezza -> MVP3)
// ---------------------------------------------------------------------------
function parseArticle(message) {
  let raw = "";
  if (message.content && Array.isArray(message.content) && message.content[0] && message.content[0].text) {
    raw = message.content[0].text;
  } else {
    raw = JSON.stringify(message);
  }

  // Strip markdown fences
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const first = cleaned.indexOf("\n");
    if (first > -1) cleaned = cleaned.slice(first + 1);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();
  }

  // Replace newlines with spaces
  cleaned = cleaned.replace(/[\r\n]+/g, " ");

  // Fix unescaped double quotes in HTML attributes: ="value" -> ='value'
  cleaned = cleaned.replace(/="([^"]{0,500}?)"/g, "='$1'");

  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e1) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Nessun JSON trovato. Inizio: " + raw.substring(0, 300));
    parsed = JSON.parse(m[0]);
  }

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

  const patch_body = {
    status: "draft",
    title: parsed.titolo_seo || parsed.h1 || "Articolo Nove C",
    slug: slug,
    template: WP_POST_TEMPLATE,
    categories: [3],
    featured_media: 5026,
    excerpt: parsed.meta_description || "",
    acf: {
      titoli: { titolo_h2: "", testo: html, testo_call_to_action: ctaHtml },
      estratto: parsed.estratto || parsed.meta_description || ""
    }
  };

  return {
    titolo_seo: patch_body.title,
    focus_keyword: focusKw,
    meta_description: parsed.meta_description || "",
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
        rank_math_title: `${article.titolo_seo} | Nove C`,
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
  console.log(`Topic settimana ${ctx.weekNumber}: ${ctx.topic.focusKeyword}`);
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

  console.log(`\nFatto. Bozza pronta per la revisione:`);
  console.log(`  Admin:     ${WP_BASE}/wp-admin/post.php?post=${post.id}&action=edit`);
  console.log(`  Anteprima: ${WP_BASE}/?p=${post.id}&preview=true`);
}

main().catch((err) => {
  console.error("ERRORE:", err.message);
  process.exit(1);
});
