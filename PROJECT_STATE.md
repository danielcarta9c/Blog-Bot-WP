# PROJECT_STATE — NoveC SEO Blog

> Single source of truth dello stato operativo. Si aggiorna a ogni commit.
> Tre sezioni in ordine fisso: **Now** (max 3), **Next** (per priorità),
> **Done log** (anti-cronologico, con hash commit). Niente burndown/velocity
> (§16). I segreti non si scrivono mai qui: solo "dove vivono".

## Ambienti live

| Componente | Dove gira | Provider | Branch/Env | Piano | Segreti (dove vivono) | Note |
|---|---|---|---|---|---|---|
| Scheduler | GitHub Actions | GitHub | `main` (cron) | repo pubblico | GitHub Secrets repo | cron settimanale + run manuale; Actions illimitate |
| AI | API Anthropic | Anthropic | — | Claude Pro Max / API | `ANTHROPIC_API_KEY` (Secret) | modello `claude-sonnet-4-6` |
| Ricerca | Brave Search API | Brave | — | — | `BRAVE_API_KEY` (Secret) | header `X-Subscription-Token` |
| CMS | nove-c.com (WP REST + Rank Math) | WordPress | produzione | — | `WP_USER` + `WP_APP_PASSWORD` (Secret) | publish PROGRAMMATO (status future, cat. 3). ⚠️ hosting SiteGround: l'anti-bot (sgcaptcha) puo' sfidare le API sotto molti run ravvicinati |
| Repo | github.com/danielcarta9c/**Blog-Bot-WP** | GitHub | `main` | pubblico | — | rinominato da `n8n`. ⚠️ il git proxy di sessione resta agganciato al vecchio nome: scritture via API GitHub (MCP), non `git push` |
| Immagini | API OpenAI | OpenAI | — | OpenAI Platform | `OPENAI_API_KEY` (Secret) | `gpt-image-1`, quality medium; immagine in evidenza |
| ~~n8n~~ | ~~cloud n8n~~ | ~~n8n (a pagamento)~~ | — | **DISMESSO** | — | flusso staccato; canone da disdire/disdetto |

> **Stato: Release 1 + MVP4/B1 + publish programmato + rotazione tracciata +
> polish SEO, in produzione.** Il sistema gira su **GitHub Actions** (cron
> settimanale → articolo PROGRAMMATO su WordPress con immagine) ed è validato
> live. n8n staccato. `n8nesistente` = riferimento storico.

## Now (max 3)

- [x] **In produzione e validati live**: Release 1 (n8n staccato) + MVP4/B1
      (immagine) + **publish PROGRAMMATO** + **URL corta** + **rotazione
      argomenti TRACCIATA** + **polish SEO** (keyword corte, power word Rank
      Math IT, verificatore pre-publish). Ultima prova: art. 5473, Rank Math **82**.
- [ ] **Da fare lato WP (Daniel)**: installare un plugin ToC riconosciuto
      (es. Easy Table of Contents) → chiude l'ultimo check Rank Math.
- [ ] Rodaggio → prossima release: B2 link interni, D1 log, immagine inline
      (per alt su immagini nel corpo). Ripartenza: `HANDOFF.md`.

## Next (backlog prossima release — per priorità)

> Roadmap completa con obiettivi e test di accettazione in `ROADMAP.md`.
> MVP1 / MVP1.1 / MVP3 = FATTI (vedi Done log). MVP2 (email) = saltato (scelta PM).

0. **ToC (lato WP, Daniel)**: installare/attivare un plugin ToC riconosciuto da
   Rank Math (es. Easy Table of Contents) → chiude il check "Table of Contents".
   Rank Math passa sulla sola presenza del plugin (non serve che l'indice si
   veda; se lo si vuole visibile serve una modifica al template ACF — a parte).
1. **MVP4 — contenuto**: ~~B1 immagini featured~~ FATTO. Restano: **B2** link
   interni reali (da REST WP), **D1** log storico. **Immagine inline** nel corpo
   (chiuderebbe il check Rank Math "keyword nell'alt" sulle immagini di contenuto).
2. **A4** (opzionale): anti-doppioni (check slug su WP). ~~A3 quality gate~~ =
   fatto in versione "reporting" (verifyArticle stampa la checklist pre-publish);
   eventuale evoluzione = rigenerazione automatica sotto soglia.
3. **Bug/feature dal rodaggio**: raccogliere quanto emerge dall'uso reale.

## Done log

- **Polish SEO — density** (PR #16): target focus keyword nel prompt alzato da
  12-18 a **16-22** occorrenze (~1.0-1.5%), per non lasciare punti sul density
  (era 0.62 verde ma bassino). Effetto dal prossimo run.
- **Polish SEO — keyword + power word + verificatore** (PR #15, validato live art.
  5473 → Rank Math **82**, da 72): focusKeyword accorciate a 2-4 parole in
  `topics.json` (slug invariati → rotazione intatta); `POWER_WORDS` allineata alla
  **lista italiana di Rank Math** (match per parola intera, default invariabile
  "essenziale") + prompt/schema aggiornati → il check power word passa; **verificatore
  pre-publish** `verifyArticle()` (quality gate A3 "reporting": checklist ✓/✗ nel
  log); blocco `_regole` in `topics.json`. Config lato WP: **lingua sito = Italiano**
  (così Rank Math usa le power word IT) e **fuso Europe/Rome** (publish programmato
  puntuale). Nota: alt-immagini nel corpo e ToC restano aperti (immagine inline / plugin WP).
- **Rotazione argomenti TRACCIATA** (PR #13, validato live art. 5473): stato in
  `ops/rotation-state.json` (slug → data ultimo uso), ri-committato su main dal
  workflow; selezione = primo topic non-usato in ordine `topics.json` (l'ordine è
  la leva del PM); LRU + issue a esaurimento; marcatura "usato" solo a publish
  riuscito; `next.json` invariato e prioritario. Stato **seedato** con lo storico
  (settimane 21-25). Sostituisce la vecchia rotazione cieca `weekNumber % len`
  (cannibalizzazione SEO). Spec: `docs/feature-rotazione-tracciata.md`.
- **Publish programmato + URL corta** (validato live, articolo 5466): patch_body
  `status: future` + `date_gmt` = prossime 09:00 UTC (≥4h) → l'articolo va online
  da solo a metà mattina, con finestra di veto per Daniel (mai più solo draft,
  mai publish immediato). `shortenSlug()` taglia lo slug a ≤60 char su confine di
  parola. **Scoperta**: i fallimenti "risposta non-JSON `<html>`" (anche la vecchia
  issue #7) erano l'**anti-bot SiteGround (sgcaptcha)** che sfida le API sotto molti
  run ravvicinati; a IP "raffreddato" (cadenza normale) funziona. Fix durevole se
  ricapita: whitelist `/wp-json/` nell'Anti-Bot SiteGround.
- **MVP4/B1 — immagine in evidenza** (validato live): Claude sceglie il
  registro adatto all'articolo (installazione/comfort/prodotto/architettura/
  fiducia) nel campo `brief_immagine`; lo script aggiunge lo stile fotografico
  fisso (persone di spalle, media distanza), genera con OpenAI `gpt-image-1`
  (quality medium), carica su WP e imposta alt = focus keyword → `featured_media`.
  Non bloccante (fallback 5026 se OPENAI_API_KEY manca/fallisce). Bozza 5464,
  media 5463. Repo rinominato `n8n`→`Blog-Bot-WP` (git proxy → scritture via API).
- **RELEASE 1 — n8n DISMESSO**: Daniel ha staccato il flusso n8n. Obiettivo
  del progetto raggiunto: canone eliminato, generazione SEO migrata su GitHub
  Actions. Sistema in produzione. Restore point: branch `mvp1.1`. Sessione
  chiusa con `HANDOFF.md`.
- **Fix regressione SEO + robustezza** (PR #6, #8): dopo A1 il punteggio Rank
  Math era calato (40) per titolo SEO/meta senza focus keyword + power word.
  Fix deterministico (titolo SEO keyword-led, FK in meta, titolo visibile
  naturale) → **80/100, 4 check verdi** (bozza 5429). Aggiunto `fetchJson`
  con retry su risposte transitorie WP (HTML/5xx). A2 confermato live: issue
  #7 aperta in automatico su un run fallito, poi chiusa.
- **MVP3 slim** (PR #5): A1 output strutturato di Claude via tool use (addio
  parsing fragile) + A2 issue GitHub automatica su run fallito (no email,
  scelta PM). A3/A4 rimandati come opzionali. Testato offline.
- **MVP1.1 validato live**: override one-off testato dal PM → bozza 5422
  "Elettrificazione dei Carichi con Pompa di Calore" (stile numbers-first,
  1644 parole, FK 25x densità 1.52%, 3 link est + 3 int, 0 warning),
  next.json auto-svuotato. Campo rinominato `template`→`stile` + guida
  per-campo (_aiuto_) in next.json.
- **MVP1.1** (C1+C2): argomenti editabili in `topics.json` + override one-off
  in `next.json` consumato e svuotato a fine run. Niente MCP (overkill,
  scartato col PM). Testato offline: rotazione + override + auto-clear.
- **MVP1 validato live** (run #2, push event): bozza WP id 5412, 2080 parole,
  7 H2, FK 15x densità 0.72%, 2 link esterni + 3 interni, 0 warning. Template
  `single-blog-nuovo.php` impostato dallo script. Loop §35 confermato:
  lanciato da git (file-trigger), esito letto da `ops/out/*.log` auto-committato.
- MVP1 codice: `generate.mjs` (7 nodi n8n, fetch nativo, zero deps) +
  workflow Actions (cron lun 02:00 UTC + dispatch) + `RUNBOOK.md`. Pipeline
  verificata offline (status draft, cat 3, pulizia HTML, meta Rank Math).
- Workflow allineato a §35 (PR #2): launch file-trigger + auto-commit log.
- Fix template "Blog Post (Nuovo)" = `single-blog-nuovo.php` nel patch_body.
- _(in corso)_ Roadmap a fasi (`ROADMAP.md`): MVP1 bozza WP, MVP2 email,
  MVP3 robustezza+controllo editoriale, MVP4 contenuto. Scope MVP3 deciso
  dal PM (Robustezza A + Controllo editoriale C).
- _(in corso)_ Scaffold iniziale del progetto: analisi flusso n8n + doc lean
  (CLAUDE.md, PROJECT_STATE.md, ADR-0001 migrazione n8n→GitHub Actions).
