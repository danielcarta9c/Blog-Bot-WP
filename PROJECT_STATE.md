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
| CMS | nove-c.com (WP REST + Rank Math) | WordPress | produzione | — | `WP_USER` + `WP_APP_PASSWORD` (Secret) | crea SOLO bozze (cat. 3) |
| Repo | github.com/danielcarta9c/n8n | GitHub | `main` | pubblico | — | nome storico "n8n"; rinomina = cosmesi (vedi backlog) |
| ~~n8n~~ | ~~cloud n8n~~ | ~~n8n (a pagamento)~~ | — | **DISMESSO** | — | flusso staccato; canone da disdire/disdetto |

> **Stato: Release 1 in produzione.** Il sistema gira su **GitHub Actions**
> (cron settimanale → bozza su WordPress) ed è validato live. Il flusso **n8n
> è stato staccato** da Daniel: obiettivo del progetto (eliminare il canone)
> raggiunto. `n8nesistente` resta nel repo come riferimento funzionale storico.

## Now (max 3)

- [x] **RELEASE 1 SPEDITA** e in produzione: n8n staccato (canone eliminato),
      sistema live su GitHub Actions. MVP1 + MVP1.1 + MVP3 validati, Rank Math 80/100.
- [ ] **Periodo di rodaggio**: Daniel usa MVP3 in produzione; raccoglie
      eventuali bug/feature → si fa tutto insieme nella **prossima release**.
- [ ] Sessione chiusa: vedi `HANDOFF.md` per ripartire.

## Next (backlog prossima release — per priorità)

> Roadmap completa con obiettivi e test di accettazione in `ROADMAP.md`.
> MVP1 / MVP1.1 / MVP3 = FATTI (vedi Done log). MVP2 (email) = saltato (scelta PM).

1. **Bug/feature dal rodaggio**: raccogliere quanto emerge dall'uso reale di
   MVP3 e affrontarlo in blocco (richiesta esplicita del PM).
2. **MVP4 — contenuto**: B1 immagini featured (chiude anche il check "alt
   immagini" di Rank Math), B2 link interni reali (da REST WP), D1 log storico.
3. **A3 / A4** (opzionali): quality gate SEO con rigenerazione; anti-doppioni
   (check slug su WP) — A4 risolverebbe il flag "keyword già usata".
4. **Cosmesi**: rinominare il repo (`n8n` → es. `novec-seo-blog`).

## Done log

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
