# ROADMAP — NoveC SEO Blog

> Definizione di prodotto a fasi. Ogni MVP ha un **obiettivo** e un **test
> di accettazione** ("fatto" quando..."). Filosofia: si chiude una fase
> prima di aprire la successiva (§16). Lo stato operativo vive in
> `PROJECT_STATE.md`; qui sta il **cosa** e il **perché**, non il giorno-giorno.

> **Stato:** ✅ MVP1 · ✅ MVP1.1 · ⏭️ MVP2 saltato (scelta PM) · ✅ MVP3 "slim"
> (A1+A2) · ✅ MVP4/B1 immagini · ✅ B2 link interni reali (PR #20, prova live
> ok, RM 85) · 🔶 A4 anti-doppioni + D1 registro storico mergiati (PR #21,
> validazione al run di lunedi') · ✅ Rotazione tracciata ·
> ✅ Polish SEO (keyword corte, power word Rank Math IT, verificatore A3 reporting,
> density 16-22, paragrafi brevi) · ✅ Scope blog allargato (efficienza energetica +
> incentivi) · ✅ ToC (plugin WP). Rank Math 88. n8n dismesso. Repo: `Blog-Bot-WP`.

## MVP1 — Bozza su WordPress (core) — ✅ FATTO

**Obiettivo:** il job gira da GitHub Actions ogni notte tra domenica e
lunedì e crea l'articolo come **bozza** su WP (`nove-c.com`, categoria 3)
con meta Rank Math impostati. Nessuna pubblicazione automatica.

**Test di accettazione:** lunedì mattina trovo in WP una bozza nuova,
categoria corretta, con titolo SEO + focus keyword + meta description su
Rank Math. Il run manuale (`workflow_dispatch`) produce lo stesso risultato.

**Scope:** replica 1:1 dei 7 nodi n8n (topic rotation → Brave → Claude →
parsing/diagnostica → POST bozza WP → Rank Math meta). Niente email.

## MVP2 — Notifica email (cosmesi) — ⏭️ SALTATO (scelta PM)

**Obiettivo:** ricevere una mail di riepilogo quando la bozza è pronta.

**Test di accettazione:** dopo il run arriva a `danielcarta@nove-c.com` una
mail con titolo, slug, focus keyword, diagnostica SEO e link "apri in WP".

**Scope:** SMTP + App Password Gmail (o action di terze parti). Se mai servisse,
è uno step nel workflow esistente (no webhook, no infrastruttura). I fallimenti
sono già coperti dalla issue automatica (A2).

## MVP3 — Robustezza + Controllo editoriale — ✅ FATTO ("slim")

**Obiettivo:** il flusso smette di rompersi in silenzio e Daniel guida i
contenuti senza toccare la logica.

**Test di accettazione:**
- Un output "sporco" o un errore di Claude/WP **non** crea una bozza rotta
  e **genera una notifica** (niente fallimento silenzioso).
- Modifico `topics.json`, lancio il run, e l'articolo usa i nuovi topic.

**Scope (MVP3 "slim" deciso dal PM — fatto A1 + A2; A3/A4 opzionali):**
- **A1** ✅ Output strutturato Claude via **tool use**: l'articolo arriva già
  come oggetto (tool_use.input), niente più strip fence / swap virgolette /
  JSON.parse del testo. Eliminata la fragilità del parsing.
- **A2** ✅ Su fallimento del run il workflow apre una **issue GitHub**
  (niente email, come da preferenza PM) con link al run + coda di log.
- **A3** ✅ _(versione "reporting")_ Quality gate SEO: `verifyArticle()` stampa
  una checklist ✓/✗ delle regole PRIMA del publish (power word, FK in titolo/
  meta/primi-200/H2, densità, word count, H2, slug, link). Non blocca (c'è la
  finestra di veto). Evoluzione possibile: rigenerazione automatica sotto soglia.
- **A4** 🔶 MERGIATO (#21, validazione lunedi') — Anti-doppioni, promosso da opzionale dopo un doppione
  reale nel rodaggio: i topic gia' online (anche pubblicati via override, che
  non marca la rotazione) vengono saltati e segnati in rotazione con la data
  del pezzo live. Accettazione: al run di lunedi' "piscine" viene saltato da
  solo e si pubblica il primo topic davvero libero.
- ~~**C1** `topics.json` editabile~~ → anticipato a **MVP1.1** (fatto).
- ~~**C2** override one-off della rotazione~~ → anticipato a **MVP1.1**
  (`next.json` auto-svuotante, fatto).

## MVP4 — Arricchimento contenuto (B1 ✅ fatto)

**Obiettivo:** alzare la qualità SEO e visiva dell'articolo.

**Test di accettazione:** la bozza ha una featured image coerente, contiene
link interni a post WP **reali** esistenti, ed esiste un log storico degli
articoli generati.

**Scope:**
- **B1** ✅ FATTO — Immagine in evidenza generata con OpenAI (`gpt-image-1`,
  quality medium): registro scelto da Claude (`brief_immagine`) + stile
  fotografico fisso (persone di spalle, media distanza), upload su WP con
  alt = focus keyword, `featured_media` dinamico. Non bloccante (fallback
  `5026`). Validato live. Aperto: valutare quality high vs medium; immagine
  anche nel corpo articolo.
- **B2** ✅ FATTO (PR #20, prova live ok) — Link interni reali: GET via REST
  degli articoli pubblicati (cat. 3), selezione dei pertinenti per token in
  comune, 2-3 link contestuali nel corpo al posto dei 2 URL fissi (CTA
  invariata); gemello del topic escluso per token dello slug; fallback sui
  fissi se la GET fallisce o mancano candidati. Prova live: art. 5484 con
  5/5 correlati linkati, verificatore 13/13. Resta la conferma del punteggio
  Rank Math dal PM nella finestra di veto.
- **D1** 🔶 MERGIATO (#21, validazione lunedi') — Log storico: `ops/articles.csv` (una riga per
  articolo generato: data, id, titolo, keyword, metriche, origine) committato
  dal workflow + riepilogo nel summary della Action (§35 auto-commit log).

## Rotazione argomenti tracciata — ✅ FATTO

**Obiettivo:** basta rotazione cieca (`weekNumber % len`) che ripete le keyword
e cannibalizza la SEO; scelta guidata e con memoria di cosa è già uscito.

**Fatto:** stato in `ops/rotation-state.json` (slug → data), selezione = primo
topic non-usato in ordine `topics.json` (l'ordine è la leva editoriale), LRU +
issue a esaurimento, marcatura solo a publish riuscito, `next.json` invariato e
prioritario. Stato seedato con lo storico. Spec: `docs/feature-rotazione-tracciata.md`.

## Polish SEO (keyword + power word + verificatore) — ✅ FATTO

**Obiettivo:** chiudere gli errori Rank Math ricorrenti (densità, URL lungo,
power word) emersi dal rodaggio.

**Fatto:** focus keyword accorciate a 2-4 parole (`topics.json`, slug invariati);
`POWER_WORDS` allineata alla lista italiana di Rank Math (default invariabile,
match per parola intera); target density alzato a 16-22; **paragrafi brevi**
(prompt + check nel verificatore); verificatore pre-publish `verifyArticle()`
(= A3 reporting); regole editoriali in `topics.json` (`_regole`). Config lato WP:
lingua sito Italiano + fuso Europe/Rome + plugin ToC. Validato: art. 5480 → **88**.

## Scope blog allargato — ✅ FATTO

**Obiettivo:** il blog non è solo Conto Termico: è efficienza energetica +
incentivi per il residenziale (pompe di calore, fotovoltaico, autoconsumo/CER,
riqualificazione, bandi/fondi).

**Fatto:** prompt aggiornato → CT 3.0 resta il riferimento per pompe di calore/
termico; per fotovoltaico/autoconsumo/CER/altro si usa il quadro incentivante
pertinente senza forzare il CT. Citazione fonti resa condizionale al tema.

**Resta aperto (SEO):** immagine inline nel corpo (per l'alt sulle immagini di
contenuto); nuovi topic (CER, FV condominio, accumulo, colonnine, bandi;
raffrescamento, PdC appartamento, "CT 3.0 come funziona").

## Fuori scope (anti-overengineering, §13)

Dashboard, database, multi-utente, A/B testing dei titoli, coda di
pubblicazione complessa. Per un articolo a settimana è sproporzionato.
Si riapre solo con dolore presente chiaro e quantificato.
