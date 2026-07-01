# Spec — Rotazione argomenti tracciata (B + C)

> **Stato: DA IMPLEMENTARE.** Progettata con Daniel; sviluppo demandato a una
> nuova sessione. Questa spec è pensata per essere autosufficiente: un Claude
> nuovo la implementa senza fare domande. Leggi prima `HANDOFF.md`.

## Perché

Oggi `selectTopic()` sceglie l'argomento con `weekNumber % topics.length`:
rotazione **cieca** che dopo N settimane **ripete** gli stessi argomenti e le
stesse focus keyword. Conseguenze: flag Rank Math "keyword già usata" e —
soprattutto — **cannibalizzazione SEO** (due articoli che competono sulla
stessa keyword). Nessuna traccia di cosa è stato pubblicato.

## Cosa deve fare (comportamento)

1. **Selezione** = il **primo argomento in ordine di `topics.json`** il cui
   `slug` NON è ancora nello stato "usati". L'**ordine della lista è la leva di
   Daniel**: mettere un topic in cima = "è il prossimo".
2. **Tracciamento** in un file di stato separato **`ops/rotation-state.json`**
   (mappa `slug → data ultimo uso`), gestito dallo script e **ri-committato su
   `main`** dal workflow (come già facciamo per log/next.json). `topics.json`
   resta pulito, lo edita solo Daniel.
3. **Identità per `slug`** (stabile), non per posizione: riordinare/aggiungere/
   rimuovere topic non corrompe la traccia. Un topic nuovo (slug non in stato)
   è "non usato" → ha priorità naturale. Slug orfani (topic rimosso) ignorati.
4. **Marcatura "usato" SOLO a pubblicazione riuscita** (dopo `createDraft` ok),
   come per `clearOverride()`. Se il run fallisce, il topic resta disponibile.
5. **Esaurimento** (nessun topic non-usato): **pubblica il meno-recente** (LRU,
   data più vecchia) **+ apre una issue GitHub** "Argomenti esauriti: aggiungi
   nuovi topic a topics.json". [Decisione presa: non salta la settimana.
   *Alternativa* documentata: saltare la settimana e pubblicare nulla — cambio
   di poche righe se il PM preferisce.]
6. **`next.json` invariato e PRIORITARIO**: se ha un `titolo`, bypassa la
   rotazione e **NON scrive lo stato** (è un one-off fuori rotazione). Resta
   per gli articoli estemporanei (novità). NB: per dire "questo la prossima
   settimana" ora basta metterlo in cima a `topics.json`; `next.json` serve
   solo per temi non in lista.

## Formato `ops/rotation-state.json`

```json
{
  "_leggimi": "Stato rotazione: quando ogni argomento e' stato pubblicato. Gestito dallo script, NON modificare a mano. Per scegliere il prossimo, riordina topics.json (il primo non ancora usato e' il prossimo).",
  "usati": {
    "sostituzione-caldaia-pompa-di-calore-villa": "2026-07-06",
    "sconto-in-fattura-pompa-di-calore-privati": "2026-07-13"
  }
}
```
- `unused` = topic il cui `slug` NON è chiave in `usati`.
- Assente/vuoto (primo run) → tutti unused → parte dal primo della lista.

## Modifiche al codice (`generate.mjs`)

- **`selectTopic()`**: sostituire la selezione `weekNumber % len` del **topic**
  con: leggi stato → primo unused in ordine lista → se nessuno, LRU + flag
  `esaurito=true`. Lo **stile/template** resta su `weekNumber % stili.length`
  (la ripetizione di stile non crea cannibalizzazione: non toccarla).
- Helper: `readRotationState()`, `writeRotationState(state)`,
  `pickTopic(topics, state)` (ritorna `{topic, esaurito}`).
- **`main()`**: dopo `createDraft` ok e **solo se non override**,
  `state.usati[topic.slug] = oggi` + `writeRotationState`. Se `esaurito`,
  stampa nel log un marker `ARGOMENTI_ESAURITI` (per la notifica).
- **Notifica esaurimento (issue)**: opzione consigliata = **step nel workflow**
  `if` il log contiene `ARGOMENTI_ESAURITI` → `gh issue create` (analogo ad A2,
  ma su marker invece che su failure). Dedup opzionale (`gh issue list --search`).
  Alternativa: lo script apre l'issue via REST con `GITHUB_TOKEN` in env.
- **Workflow `seo-blog.yml`**: aggiungere `ops/rotation-state.json` al
  `git add` dello step "Commit log su main"; (se scelta step) aggiungere lo
  step issue-su-marker.

## Test di accettazione

- Run 1 pubblica `topics[0]`; stato registra il suo slug.
- Run 2 pubblica il primo unused (`topics[1]`), ecc.
- Aggiungo un topic e lo metto in cima → al run successivo viene scelto lui.
- `next.json` con titolo → bypassa rotazione, stato **invariato**.
- Tutti usati → pubblica il più vecchio **e** compare la issue "argomenti esauriti".
- Lo stato **sopravvive tra i run** (committato su `main`).

## Fuori scope (per ora)

- Generazione automatica di nuovi argomenti con AI.
- Variazione automatica della focus keyword a ogni ciclo.
- Precompilare lo stato con gli articoli storici già su WP (opzionale, bassa
  priorità: con la lista che cresce si riallinea da solo).
