# PROJECT_STATE — NoveC SEO Blog

> Single source of truth dello stato operativo. Si aggiorna a ogni commit.
> Tre sezioni in ordine fisso: **Now** (max 3), **Next** (per priorità),
> **Done log** (anti-cronologico, con hash commit). Niente burndown/velocity
> (§16). I segreti non si scrivono mai qui: solo "dove vivono".

## Ambienti live

| Componente | Dove gira | Provider | Branch/Env | Piano | Segreti (dove vivono) | Note |
|---|---|---|---|---|---|---|
| Scheduler | GitHub Actions | GitHub | `main` (cron) | da definire (pub/priv) | GitHub Secrets repo | cron settimanale + run manuale |
| AI | API Anthropic | Anthropic | — | Claude Pro Max / API | `ANTHROPIC_API_KEY` (Secret) | modello `claude-sonnet-4-6` |
| Ricerca | Brave Search API | Brave | — | — | `BRAVE_API_KEY` (Secret) | header `X-Subscription-Token` |
| CMS | nove-c.com (WP REST + Rank Math) | WordPress | produzione | — | `WP_USER` + `WP_APP_PASSWORD` (Secret) | crea SOLO bozze (cat. 3) |
| Repo | github.com/danielcarta9c/n8n | GitHub | — | — | — | da rinominare? (vedi Next) |

> Stato attuale: ancora su **n8n (a pagamento)**, workflow `s8ZB19pBRYeDADBU`
> "NoveC SEO Blog - v2", `active: false`. Resta la sorgente di verità
> funzionale (`n8nesistente`) finché la versione Actions non è validata.

## Now (max 3)

- [x] Analisi del flusso n8n esistente (`n8nesistente`) — mappati 7 nodi.
- [x] Scaffold doc lean (CLAUDE.md, PROJECT_STATE.md, ADR-0001).
- ❓ **Visibilità del repo** (decisione PM): pubblico o privato? Impatta
      (a) esposizione di URL WP + email nel codice/log, (b) minuti Actions
      (pubblico = illimitati; privato = 2000/mese, ampiamente sufficienti).
      Default proposto: **privato**. In attesa di conferma.

## Next (per priorità)

1. Script Node `generate.mjs` che replica i 7 nodi: topic rotation →
   Brave → Claude → parsing/diagnostica → POST bozza WP → Rank Math meta.
2. Workflow `.github/workflows/seo-blog.yml`: cron notte dom→lun
   (`0 2 * * 1` UTC ≈ 03-04 ora IT) + `workflow_dispatch`.
3. Documentare i Secret da configurare (RUNBOOK breve) e configurarli.
4. Run manuale di validazione (`workflow_dispatch`) → verificare bozza su WP.
5. Disattivare/dismettere il flusso n8n + valutare cancellazione canone.
6. (MVP2) Notifica email di riepilogo + diagnostica SEO.
7. (Cosmesi) Rinominare il repo (`n8n` → es. `novec-seo-blog`).

## Done log

- _(in corso)_ Scaffold iniziale del progetto: analisi flusso n8n + doc lean
  (CLAUDE.md, PROJECT_STATE.md, ADR-0001 migrazione n8n→GitHub Actions).
