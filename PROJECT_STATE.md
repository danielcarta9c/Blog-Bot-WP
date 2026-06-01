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

> Stato attuale: ancora su **n8n (a pagamento)**, workflow `s8ZB19pBRYeDADBU`
> "NoveC SEO Blog - v2", `active: false`. Resta la sorgente di verità
> funzionale (`n8nesistente`) finché la versione Actions non è validata.

## Now (max 3)

- [x] Roadmap a fasi definita (`ROADMAP.md`).
- [x] MVP1 codice: `generate.mjs` + workflow Actions (pipeline verificata offline).
- [x] Workflow allineato a §35: launch via file-trigger (`ops/run.trigger`)
      + auto-commit log (`ops/out/*.log`) per leggere l'esito via `git pull`.
- [ ] **MVP1 validazione**: secret configurati ✅; manca il primo run live
      (Daniel lo lancia) → leggere log → verificare bozza su WP. ⬅ qui ora.

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

- _(in corso)_ MVP1 codice: `generate.mjs` (7 nodi n8n, fetch nativo, zero deps) +
  workflow Actions (cron lun 02:00 UTC + dispatch) + `RUNBOOK.md`. Pipeline
  verificata offline (status draft, cat 3, pulizia HTML, meta Rank Math).
- _(in corso)_ Roadmap a fasi (`ROADMAP.md`): MVP1 bozza WP, MVP2 email,
  MVP3 robustezza+controllo editoriale, MVP4 contenuto. Scope MVP3 deciso
  dal PM (Robustezza A + Controllo editoriale C).
- _(in corso)_ Scaffold iniziale del progetto: analisi flusso n8n + doc lean
  (CLAUDE.md, PROJECT_STATE.md, ADR-0001 migrazione n8n→GitHub Actions).
