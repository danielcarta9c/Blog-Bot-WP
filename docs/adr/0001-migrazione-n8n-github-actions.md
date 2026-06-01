# ADR 0001 — Migrazione del SEO blog bot da n8n a GitHub Actions

**Stato:** accettato — giugno 2026

## Contesto

Il flusso "NoveC SEO Blog - v2" è l'**unico** workflow attivo su n8n, un
servizio **a pagamento**. È un job **lineare** (nessun branching, loop o
stato persistente): trigger settimanale → selezione topic → ricerca Brave →
generazione articolo con Claude → parsing/diagnostica → creazione bozza
WordPress → meta Rank Math → email. Pagare un canone per un solo job
schedulato lineare è ingiustificato. Il Playbook §12 prevede esplicitamente
la possibile dismissione di n8n.

## Decisione

Riscrivere il flusso come **singolo script Node.js** eseguito da **GitHub
Actions** con trigger `schedule` (cron settimanale) + `workflow_dispatch`
(run manuale). Segreti in **GitHub Secrets**. È l'applicazione diretta del
pattern §35 (ops automation via Actions). MVP1 esclude la notifica email
(MVP2).

## Motivazione

- **Costo**: elimina il canone n8n. Su Actions un job settimanale è di
  fatto gratuito (illimitato su repo pubblico; ben dentro i 2000 min/mese
  su privato).
- **Aderenza al metodo**: §13 (radical lean — tutto in file versionati),
  §35 (ops via Actions + log auto-commit). Nessun nuovo servizio: GitHub è
  già nell'inventario §12.
- **Mappatura 1:1**: i due nodi `Code` n8n sono già JavaScript puro
  (copiabili quasi com'è); le chiamate HTTP diventano `fetch`; Claude via
  `@anthropic-ai/sdk`.
- **Versionamento e log**: il flusso diventa codice in Git con storia e
  log di run, cosa che n8n non dà nativamente.

**Alternative scartate:**
- _n8n self-hosted su VPS_: sensato solo con molti flussi/UI/stato. Per un
  singolo job lineare è overengineering (§13).
- _Restare su n8n_: mantiene un canone per un solo job. Scartato.

**Trade-off accettati:**
- Il cron di Actions **non è puntuale** (può ritardare di minuti o, raro,
  saltare un run). Irrilevante per un articolo settimanale.
- Actions **disabilita i cron schedulati dopo 60 giorni** di inattività del
  repo. Mitigato dal fatto che il repo riceve commit con regolarità.
- L'email Gmail OAuth2 di n8n non si replica banalmente in Actions →
  rimandata a MVP2 (SMTP + App Password, o action di terze parti).

## Conseguenze

**Più facile:** eliminare il canone; versionare/loggare il flusso; far
evolvere la logica con PR review.

**Più difficile:** debugging "visuale" (in n8n si vede il flusso a nodi);
in Actions si legge dai log testuali. La notifica email richiede lavoro
extra (MVP2).

## Quando rivedere

- Se nascono **≥3 flussi** di automazione con branching/stato/UI →
  rivalutare n8n self-hosted (nuovo ADR che supera questo).
- Se il cron di Actions si rivela troppo inaffidabile per l'esigenza.
