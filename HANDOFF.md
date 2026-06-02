# HANDOFF — NoveC SEO Blog

> Per il prossimo Claude (nuova sessione, nessun accesso alla chat precedente).
> Leggi questo **per primo**, poi `PROJECT_STATE.md` e `CLAUDE.md`. È pensato
> per ripartire senza fare domande a Daniel. Quando l'hai consumato e lo stato
> è di nuovo allineato, puoi cancellare questo file e la riga "PRIMA LETTURA"
> in cima a `CLAUDE.md` (§32.5 del Playbook nove-c-kit).

## 1. Stato attuale (dove siamo)

- **Release 1 in produzione.** Il flusso n8n "NoveC SEO Blog - v2" è stato
  **migrato a GitHub Actions** e **n8n è stato staccato da Daniel**: obiettivo
  del progetto (eliminare il canone n8n) **raggiunto**.
- Il sistema gira: ogni lunedì 02:00 UTC un job genera un articolo SEO come
  **bozza** su WordPress (`nove-c.com`, categoria 3) con meta Rank Math. Mai
  pubblicazione automatica.
- **Fatto e validato live:** MVP1 (bozza settimanale), MVP1.1 (lista argomenti
  editabile + override one-off), MVP3 "slim" (output strutturato, issue su
  fallimento, garanzie SEO titolo/meta, retry HTTP). Punteggio **Rank Math 80/100**.
- **MVP2 (email) saltato** per scelta del PM (gli interessa meno; controlla WP
  di persona). **MVP4 (immagini, link interni reali) rimandato.**
- Tutto è su `main`. Branch **`mvp1.1`** = segnalibro/restore-point stabile.

## 2. Lavoro aperto (come riprendere)

Daniel ora **usa MVP3 in produzione per un periodo di rodaggio**, raccoglie
bug/feature emersi dall'uso reale e vuole affrontarli **tutti insieme nella
prossima release** (non a spizzichi). Backlog ordinato in `PROJECT_STATE.md` →
Next. In sintesi:
1. Bug/feature dal rodaggio (da raccogliere).
2. **MVP4**: immagini featured (oggi `featured_media` è hardcoded a `5026`;
   chiuderebbe anche il check Rank Math "alt delle immagini"); link interni
   reali pescati dalla REST di WP; log storico.
3. **A3/A4** opzionali: quality gate SEO con rigenerazione; anti-doppioni
   (check slug su WP) — A4 risolve il flag Rank Math "keyword già usata".
4. Cosmesi: rinominare il repo (`n8n` → es. `novec-seo-blog`).

### Come funziona il sistema (così non chiedi a Daniel)

- **Codice**: tutto in un unico file **`generate.mjs`** (Node 20, **zero
  dipendenze npm**, solo `fetch` nativo). Eseguito da
  **`.github/workflows/seo-blog.yml`**.
- **Pipeline** (replica i 7 nodi n8n, l'export storico è in `n8nesistente`):
  scegli argomento → ricerca Brave → articolo con Claude (`claude-sonnet-4-6`,
  via **tool use** `pubblica_articolo`) → diagnostica SEO → crea bozza WP
  (`POST /wp-json/wp/v2/posts`, `status:draft`, `categories:[3]`,
  `template:single-blog-nuovo.php`) → meta Rank Math
  (`POST /wp-json/rankmath/v1/updateMeta`).
- **Segreti** (GitHub → Settings → Secrets → Actions): `ANTHROPIC_API_KEY`,
  `BRAVE_API_KEY`, `WP_USER` (= username WP, non email), `WP_APP_PASSWORD`
  (= Application Password di WordPress, non la password di login). Mai nel codice.
- **Argomenti**: `topics.json` (lista rotazione settimanale + 5 "stili" di
  scrittura). Daniel lo edita per cambiare i temi.
- **Articolo "su richiesta"**: `next.json`. Si compilano `titolo`,
  `focus_keyword`, `brief`, `stile`; si committa → parte un run con quel
  titolo; a run riuscito il file **si svuota da solo** (no stale state sul
  cron). Vuoto/assente/solo-spazi ⇒ rotazione normale. ⚠️ `stile` =
  schema del TESTO (problem-solution | how-to-guide | faq-driven |
  numbers-first | comparison), **NON** il template grafico WP.
- **Lancio (pattern §35 del Playbook)**: 3 modi — cron; `workflow_dispatch`
  dalla UI; **file-trigger**: bumpare il numero in `ops/run.trigger` e
  committare su `main` (è il modo "da git", l'unico che l'agente può usare
  senza permessi di dispatch).
- **Osservabilità**: ogni run scrive `ops/out/<timestamp>.log` e lo
  **ricommitta su `main`** (con `[skip ci]`) → leggi l'esito con `git pull`,
  niente copia-incolla. Su **fallimento** il workflow apre **una issue GitHub**
  automatica (A2) → Daniel notificato, niente email.
- **Garanzie SEO** (in `generate.mjs`): `buildSeoTitle()` forza la focus
  keyword a inizio titolo SEO + una power word; `ensureKwInMeta()` forza la
  focus keyword nella meta. Il **titolo visibile** del post resta naturale;
  si ottimizza solo il `<title>` (rank_math_title). `fetchJson()` ritenta su
  glitch transitori (5xx/429/HTML) ed esce con errori chiari.

### Verificare un run dell'agente

Dopo aver lanciato (bump `ops/run.trigger` + push su `main`), aspetta il
nuovo file in `ops/out/` (poll con `git fetch`+`git ls-tree`), poi
`git pull` e leggi il log. Per le Actions puoi usare i tool MCP
`mcp__github__actions_list` / `get_job_logs` (lettura ok; **dispatch NO**, vedi sotto).

## 3. Cosa NON ripetere (trappole già pagate)

- **Il test di accettazione vero è il PUNTEGGIO RANK MATH** (lo legge Daniel
  in WP), NON le diagnostiche interne dello script (parole/densità/link).
  Una volta ho validato sulle mie metriche → tutte verdi ma Rank Math era a 40
  (titolo SEO e meta senza focus keyword). Per modifiche alla generazione,
  fai validare il punteggio su una bozza **prima** di considerare chiuso.
- **Git tag NON si pushano** su questo remoto (proxy del sandbox): "remote end
  hung up". Per un restore-point usa un **branch** (es. `mvp1.1`), non un tag.
- **Dispatch dei workflow via MCP/API → 403** ("Resource not accessible by
  integration"). Per lanciare un run usa il **file-trigger** (§35): bumpa
  `ops/run.trigger` e pusha su `main`. Un merge di PR via API **non** fa
  partire il workflow anche se tocca i path-trigger: serve un push diretto
  che modifica `ops/run.trigger`.
- **Squash-merge + continuare sullo STESSO branch ⇒ conflitti**: dopo aver
  squashato una PR, il branch diverge da `main`. Apri **un branch nuovo dalla
  `main` aggiornata** per ogni feature.
- **Confusione "template"**: in `next.json` il campo si chiama `stile` apposta;
  il template grafico WP ("Blog Post (Nuovo)" = `single-blog-nuovo.php`) lo
  mette lo script in automatico, non si tocca.
- **Niente MCP per questo progetto** (valutato e scartato col PM: overkill,
  §13). Niente dipendenze/astrazioni "per il futuro".
- **Flag Rank Math non-bug**: "keyword già usata" compare se più bozze usano
  la stessa focus keyword (artefatto dei run di test sulla stessa settimana);
  "alt delle immagini" richiede MVP4. Non sono regressioni.

## 4. Profilo del PM (Daniel) — per tarare comunicazione e autonomia

- **Background**: termotecnica + BIM. Confidenza architetturale alta, **non
  legge codice/diff/log/stack-trace**. Ha **ottime intuizioni di prodotto** —
  verificarle, non liquidarle (ha individuato lui il problema dei titoli SEO).
- **Canale**: iPhone. **Risposte brevi** di default, PM-to-PM, perché prima
  del come, confidenza calibrata. Emoji moderate in chat, mai nei file.
- **Cosa portargli**: business, costi (€), scope, priorità, rischio. **NON** il
  "come" tecnico (lo decidi tu da senior; se rischioso glielo spieghi a parole).
- **Stile di lavoro**: lean/anti-overengineering (ha scartato lui l'MCP); gli
  piace **testare di persona** ("riempio io così faccio test"); lancia "da git".
- **Autonomia**: regola base = branch `claude/<feature>` + PR, **mai push
  diretto su `main`** per il codice (eccezione sanzionata: il file-trigger §35
  per lanciare i run). **Fermati e chiedi** prima di: merge di PR di codice,
  distruttivi (force push, reset hard), cambi di stack/dipendenze, effetti su
  WordPress in produzione oltre la creazione di **bozze**. Daniel concede
  autorizzazioni a tempo ("pusha tu e fai merge"): valgono **fino al termine
  dell'obiettivo dichiarato**, poi si torna alla regola base.
- **Regole non negoziabili**: mai segreti nel codice; mai `status:publish`
  (solo `draft`); il repo è **pubblico** (decisione PM: URL/email non sono
  segreti, le chiavi vivono nei GitHub Secrets).

## Riferimenti

- Metodo: `nove-c-kit` (PLAYBOOK.md = Costituzione; §13 lean, §32 audit
  contesto, §35 ops via Actions, §36 profilo PM).
- Stato vivo: `PROJECT_STATE.md`. Roadmap: `ROADMAP.md`. Operatività:
  `RUNBOOK.md`. Decisione strutturale: `docs/adr/0001`. Bootstrap: `CLAUDE.md`.
- Sorgente funzionale storica: `n8nesistente` (export JSON del flusso n8n).
