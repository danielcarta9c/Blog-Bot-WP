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
| Repo | github.com/danielcarta9c/n8n | GitHub | — | — | — | da rinominare? (vedi Next) |

> Stato attuale: la versione **GitHub Actions è live e validata** (run reale ok).
> Il flusso **n8n** (`s8ZB19pBRYeDADBU`, "NoveC SEO Blog - v2") resta solo come
> riferimento/backup e va **dismesso** quando Daniel è sereno (poi si valuta la
> cancellazione del canone). `n8nesistente` resta la sorgente di verità funzionale.

## Now (max 3)

- [x] **MVP1 CHIUSO**: pipeline live e validata (bozza 5412, 0 warning).
- [x] **MVP1.1** (in PR): `topics.json` lista editabile (C1) + `next.json`
      override one-off auto-svuotante (C2). Testato offline (rotazione + override).
- ❓ **Decisione PM**: prossima fase MVP2 (email) o MVP3 (resto robustezza
      A1-A4)? Daniel ci pensa con calma. + dismettere n8n quando sereno.

## Next (per priorità)

> Roadmap completa con obiettivi e test di accettazione in `ROADMAP.md`.

**MVP1 — bozza su WP:**
1. [x] Script `generate.mjs` (7 nodi replicati, senza dipendenze).
2. [x] Workflow `.github/workflows/seo-blog.yml` (cron + dispatch).
3. [x] `RUNBOOK.md` con i 4 secret e la procedura di run.
4. [ ] Configurare i secret + run manuale di validazione → bozza su WP.
5. [ ] Disattivare/dismettere il flusso n8n + valutare cancellazione canone.

**MVP2 — email:** notifica di riepilogo + diagnostica SEO.

**MVP3 — robustezza + controllo:** A1 output strutturato, A2 error
handling+notifica, A3 quality gate, A4 anti-doppioni, C1 `topics.json`
editabile, C2 pin topic settimanale.

**MVP4 — contenuto:** B1 immagini, B2 link interni reali, D1 log storico.

**Cosmesi:** rinominare il repo (`n8n` → es. `novec-seo-blog`).

## Done log

- **MVP1.1** (PR): argomenti editabili in `topics.json` (C1) + override
  one-off in `next.json` consumato e svuotato a fine run (C2). Niente MCP
  (overkill, scartato col PM). Testato offline: rotazione + override + auto-clear.
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
