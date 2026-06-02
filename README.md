# NoveC SEO Blog

Generatore automatico di articoli SEO (tema Conto Termico 3.0 / pompe di
calore) per il blog di **Nove C Ingegneria**. Ogni settimana genera un
articolo come **bozza** su WordPress (`nove-c.com`), pronto per la revisione
umana. **Nessuna pubblicazione automatica.**

Migrato da **n8n** (a pagamento) a **GitHub Actions** (cron settimanale):
canone eliminato, sistema in produzione. Decisione in
`docs/adr/0001-migrazione-n8n-github-actions.md`.

## Come funziona (in breve)

- **Quando**: cron ogni lunedì 02:00 UTC (notte dom→lun); anche manuale.
- **Cosa**: `generate.mjs` (Node 20, zero dipendenze) → sceglie un argomento
  da `topics.json` (o un titolo forzato da `next.json`) → ricerca Brave →
  scrive l'articolo con Claude (tool use) → crea la bozza su WP + meta Rank Math.
- **Lancio "da git"** e **osservabilità**: vedi `RUNBOOK.md` (pattern §35:
  file-trigger `ops/run.trigger`, log auto-committati in `ops/out/`, issue
  automatica su fallimento).

## Documenti

- `CLAUDE.md` — bootstrap per l'agente (metodo Nove C adattato a ops).
- `PROJECT_STATE.md` — stato vivo (Now / Next / Done + ambienti live).
- `docs/adr/` — decisioni architetturali.
- `n8nesistente` — export JSON del workflow n8n originale (sorgente di
  verità funzionale da replicare).

## Metodo

Costruito col metodo **Nove C**: https://github.com/danielcarta9c/nove-c-kit
