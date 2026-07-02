# HANDOFF — NoveC SEO Blog

> Per il prossimo Claude (nuova sessione, nessun accesso alla chat precedente).
> Leggi questo **per primo**, poi `PROJECT_STATE.md` e `CLAUDE.md`. È pensato
> per ripartire senza fare domande a Daniel. Quando l'hai consumato e lo stato
> è di nuovo allineato, puoi cancellare questo file e la riga "PRIMA LETTURA"
> in cima a `CLAUDE.md` (§32.5 del Playbook nove-c-kit).

> ⚠️ **REPO RINOMINATO:** ora è **`danielcarta9c/Blog-Bot-WP`** (era `n8n`). Il
> git proxy della sessione resta agganciato al vecchio nome → `git push`
> FALLISCE (fetch/read invece funzionano via redirect). **Le scritture su GitHub
> vanno fatte via API/MCP** (`push_files`, `create_or_update_file`, `delete_file`),
> non con `git push`. I tool MCP usano `repo: "n8n"` e GitHub redirige a Blog-Bot-WP.

## 1. Stato attuale (dove siamo)

- **Release 1 in produzione + MVP4/B1 + publish programmato.** Il flusso n8n è
  stato **migrato a GitHub Actions** e **staccato**: obiettivo (eliminare il canone) **raggiunto**.
- Il sistema gira: ogni lunedì 02:00 UTC un job genera un articolo SEO
  **programmato** (status `future`, online ~metà mattina) su WordPress
  (`nove-c.com`, categoria 3) con meta Rank Math e **immagine in evidenza**.
  Daniel ha la finestra del mattino per cestinarlo. Mai publish immediato.
- **Fatto e validato live:** MVP1, MVP1.1 (argomenti editabili + override
  one-off), MVP3 "slim" (output strutturato, issue su fallimento, garanzie SEO
  titolo/meta, retry HTTP), MVP4/**B1** (immagine + alt = focus keyword),
  **publish programmato + URL corta** (slug ≤60), **rotazione argomenti
  TRACCIATA**, **polish SEO** (keyword corte 2-4 parole, power word allineate
  alla lista italiana di Rank Math, verificatore pre-publish, density 16-22,
  paragrafi brevi), **scope blog allargato** (efficienza energetica + incentivi,
  non solo CT 3.0), **ToC** (plugin WP). Ultima prova: art. **5480 → Rank Math 88**.
- **MVP2 (email) saltato**, **power word FATTA**, **ToC FATTO** (plugin WP).
  **Restano:** B2 (link interni reali), D1 (log storico), immagine inline nel
  corpo (per l'alt sulle immagini di contenuto), nuovi topic; A4 opzionale.
- Tutto è su `main`. Branch **`mvp1.1`** = restore-point stabile (pre-MVP4).

## 2. Lavoro aperto (come riprendere)

Daniel **usa il sistema in produzione (rodaggio)**, raccoglie bug/feature e
vuole affrontarli **tutti insieme nella prossima release**. Backlog in
`PROJECT_STATE.md` → Next. In sintesi:

0. **MVP4 contenuto**: ~~B1 immagini~~ FATTO. Restano **B2** link interni reali
   (dalla REST WP, al posto dei 2 fissi) e **D1** log storico. **Immagine inline**
   nel corpo → chiuderebbe il check Rank Math "keyword nell'alt" (oggi c'è solo la
   featured). Aperto: quality immagine high vs medium.
1. **Nuovi topic** (idee col PM, ora che il blog è allargato): CER, fotovoltaico
   condominio, accumulo/batteria, colonnine ricarica, bandi regionali; PdC
   raffrescamento estivo, PdC in appartamento, "Conto Termico 3.0 come funziona"
   (pilastro). Aggiungere in `topics.json` (keyword corte, slug distinti, `_regole`).
2. **A4** opzionale: anti-doppioni (check slug su WP). ~~A3~~ = fatto in versione
   "reporting" (`verifyArticle()`); evoluzione = rigenerazione automatica sotto soglia.
3. Bug/feature dal rodaggio (da raccogliere).

**FATTO in questa sessione (non è più lavoro aperto):** rotazione tracciata
(`ops/rotation-state.json`), keyword corte, **power word** allineate a Rank Math IT
(+ lingua sito su Italiano), verificatore pre-publish, density 16-22, **paragrafi
brevi**, **scope blog allargato** (efficienza energetica + incentivi, non solo
CT 3.0), **+3 topic**, **ToC** (plugin WP), fuso WP Europe/Rome. Punti stabili:
merge PR #13/#15/#16/#18/#19. Risultato Rank Math: **88** (art. 5480).

### Come funziona il sistema (così non chiedi a Daniel)

- **Codice**: tutto in un unico file **`generate.mjs`** (Node 20, **zero
  dipendenze npm**, solo `fetch` nativo). Eseguito da
  **`.github/workflows/seo-blog.yml`**.
- **Pipeline** (replica i 7 nodi n8n, l'export storico è in `n8nesistente`):
  scegli argomento → ricerca Brave → articolo con Claude (`claude-sonnet-4-6`,
  via **tool use** `pubblica_articolo`) → diagnostica SEO + **verificatore** →
  [immagine OpenAI + upload WP] → crea post WP (`POST /wp-json/wp/v2/posts`,
  **`status:future`** + `date_gmt`, `categories:[3]`, `template:single-blog-nuovo.php`)
  → meta Rank Math (`POST /wp-json/rankmath/v1/updateMeta`).
- **Scope editoriale** (prompt in `generate.mjs`): il blog è **efficienza
  energetica + incentivi residenziali**, NON solo Conto Termico. Regola nel
  prompt: per pompe di calore/termico → riferimento CT 3.0 (D.M. 7/8/2025); per
  fotovoltaico/autoconsumo/CER/altro → quadro incentivante pertinente, senza
  forzare il CT. Paragrafi tenuti brevi (≤~110 parole) per la leggibilità Rank Math.
- **Segreti** (GitHub → Settings → Secrets → Actions): `ANTHROPIC_API_KEY`,
  `BRAVE_API_KEY`, `WP_USER` (= username WP, non email), `WP_APP_PASSWORD`
  (= Application Password di WordPress, non la password di login),
  `OPENAI_API_KEY` (immagini; se manca, immagine saltata e articolo col fallback).
  Mai nel codice.
- **Publish programmato**: `patch_body.status = "future"` + `date_gmt =
  scheduledPublishGmt()` (prossime 09:00 UTC ad almeno 4h). Va online da solo,
  con finestra di veto. `WP_USER` deve avere diritti di pubblicazione (confermato).
- **Immagine in evidenza (B1)**: Claude compila `brief_immagine` col registro
  adatto all'articolo; `generateImage()` aggiunge lo stile fotografico fisso
  (persone di spalle/media distanza) e genera con OpenAI `gpt-image-1` quality
  medium; `uploadFeaturedImage()` carica su WP media + `alt_text` = focus keyword
  → `featured_media`. Non bloccante (try/catch: l'articolo esce comunque).
- **URL corta**: `shortenSlug()` taglia lo slug a ≤60 char su confine di parola.
- **Argomenti (rotazione TRACCIATA)**: `topics.json` (lista + 5 "stili"). La
  scelta è il **primo topic il cui `slug` non è ancora in `ops/rotation-state.json`**
  (mappa slug → data), in ordine di lista → **l'ordine è la leva editoriale**. A
  esaurimento: LRU + issue "argomenti esauriti". Lo `slug` è la chiave: non
  rinominarlo su topic già usati. Lo stato è ri-committato su `main` dal workflow.
  Regole per scrivere bene i topic in `topics.json` → campo `_regole`.
- **Verificatore pre-publish** (`verifyArticle()`): prima di creare il post stampa
  nel log una checklist ✓/✗ delle regole SEO (power word nel titolo, FK in
  titolo/meta/primi-200/H2, densità, word count, H2, slug, link, **paragrafi
  brevi** ≤120 parole). Non blocca (c'è la finestra di veto).
- **Articolo "su richiesta"**: `next.json`. Si compilano `titolo`,
  `focus_keyword`, `brief`, `stile`; si committa → parte un run con quel
  titolo; a run riuscito il file **si svuota da solo** (no stale state sul
  cron). Vuoto/assente/solo-spazi ⇒ rotazione normale. ⚠️ `stile` =
  schema del TESTO (problem-solution | how-to-guide | faq-driven |
  numbers-first | comparison), **NON** il template grafico WP.
- **Lancio (pattern §35 del Playbook)**: 3 modi — cron; `workflow_dispatch`
  dalla UI; **file-trigger**: bumpare il numero in `ops/run.trigger` e
  committare su `main` (è il modo "da git"; ora via MCP per via del rename).
- **Osservabilità**: ogni run scrive `ops/out/<timestamp>.log` e lo
  **ricommitta su `main`** (con `[skip ci]`) → leggi l'esito con `git pull`.
  Su **fallimento** il workflow apre **una issue GitHub** automatica (A2).
- **Garanzie SEO** (in `generate.mjs`): `buildSeoTitle()` forza la focus
  keyword a inizio titolo SEO + una **power word** (se manca inietta "essenziale");
  `POWER_WORDS` = lista italiana ufficiale di Rank Math, match per parola intera,
  power word invariabili per non sbagliare genere. **Serve la lingua del sito WP =
  Italiano** o Rank Math controlla contro la lista inglese. `ensureKwInMeta()` forza
  la focus keyword nella meta. Il **titolo visibile** del post resta naturale;
  si ottimizza solo il `<title>` (rank_math_title). `fetchJson()` ritenta su
  glitch transitori (5xx/429/HTML) ed esce con errori chiari.

### Verificare un run dell'agente

Dopo aver lanciato (commit su `ops/run.trigger` via MCP), aspetta il nuovo
file in `ops/out/` (poll con `git fetch`+`git ls-tree`; le letture funzionano),
poi `git pull` e leggi il log. Per le Actions puoi usare i tool MCP
`mcp__github__actions_list` / `get_job_logs` (lettura ok; **dispatch NO**, vedi sotto).

## 3. Cosa NON ripetere (trappole già pagate)

- **Repo rinominato `n8n`→`Blog-Bot-WP`**: in ALCUNE sessioni `git push` è tornato
  a funzionare (proxy ok), in altre falliva → in quel caso scrivi via MCP
  (`push_files`/`create_or_update_file`/`delete_file`). **Le letture funzionano
  sempre.** NB per i tool MCP GitHub di questa piattaforma usa `repo:"blog-bot-wp"`
  (il vecchio `n8n` dà "not configured for this session").
- ⚠️ **`next.json` è un path-trigger, non solo `ops/run.trigger`**: qualunque
  push su `main` che modifica `next.json` (anche il **merge di una PR** che tocca
  una nota `_aiuto` in `next.json`) **fa partire un run**. Combinato con un
  file-trigger manuale → più run in coda → **più articoli pubblicati** (cascata).
  In questa sessione è successo (art. 5471 codice vecchio + 5473 codice nuovo).
  Se devi fare merge + run: fai UNA cosa sola, o metti in conto la coda.
- **Annullare un run in coda**: `mcp__github__actions_run_trigger` con
  `method:"cancel_workflow_run"` FUNZIONA via MCP (il *dispatch* invece dà 403).
- **Validare una FEATURE prima del merge**: il workflow fa `checkout ref: main`
  e ri-committa il log su `main`, quindi esegue sempre il codice di `main`. Per
  provare un branch in isolamento si può rinstradare temporaneamente checkout +
  push del log sul branch (`github.ref_name`) e ripristinare prima del merge —
  ma è fragile (occhio al `git push HEAD:main` del commit-log). Alternativa più
  semplice: merge in main e prima vera prova al cron (c'è la finestra di veto).
- **Fuso orario WordPress**: il publish programmato usa `date_gmt`; se il fuso del
  sito è sbagliato (era UTC invece di **Europe/Rome +2**) l'orario "9:00" del post
  slitta. Impostazioni → Generali → Fuso orario = Roma. (Risolto.)
- **Anti-bot SiteGround (sgcaptcha)**: se un run fallisce con "risposta non-JSON
  `<html>...sgcaptcha...`" NON è il codice: è l'hosting che scambia le API per un
  bot quando ci sono **troppi run ravvicinati** (l'IP del runner viene flaggato).
  A cadenza normale (1/settimana) non scatta. Se stai testando: **dirada i run**
  (aspetta qualche minuto) e riprova. (Era la causa anche della vecchia issue #7.)
  - **Piano SiteGround senza "Anti-Bot AI"** (è su GrowBig+): niente toggle di
    whitelist in Site Tools. Il `sgcaptcha` è comunque servito a livello **server/
    WAF**, PRIMA di WordPress → **uno snippet PHP NON lo risolve** (es.
    `rest_authentication_errors` agisce dentro WP, a valle del WAF, e riguarda
    l'auth, non l'anti-bot). Unica via per testare a raffica: **ticket supporto
    SiteGround** per escludere `/wp-json/` dalla protezione bot lato server. **Per
    la produzione non serve**: a 1 run/settimana pubblica sempre (5480/5473 ok).
- **Publish PROGRAMMATO, non draft**: il post nasce `status: future` con
  `date_gmt` alle prossime 09:00 UTC → va online da solo a metà mattina, veto di
  Daniel nella finestra. NON reintrodurre `status: draft` o `publish` immediato.
- **Il test di accettazione vero è il PUNTEGGIO RANK MATH** (lo legge Daniel
  in WP), NON le diagnostiche interne dello script (parole/densità/link).
  Una volta ho validato sulle mie metriche → tutte verdi ma Rank Math era a 40
  (titolo SEO e meta senza focus keyword). Per modifiche alla generazione,
  fai validare il punteggio su una bozza **prima** di considerare chiuso.
- **Immagini AI**: i primi che "sanno di finto" sono i volti in primo piano e
  le scene troppo ravvicinate/in posa. Persone di spalle o di 3/4 da dietro, a
  media/lunga distanza. Preferisci il beneficio/emozione (interni, cantiere)
  al prodotto; e varia il registro per articolo (non sempre pompe di calore).
- **Git tag NON si pushano** su questo remoto (proxy del sandbox): "remote end
  hung up". Per un restore-point usa un **branch** (es. `mvp1.1`), non un tag.
- **Dispatch dei workflow via MCP/API → 403** ("Resource not accessible by
  integration"). Per lanciare un run usa il **file-trigger** (§35): commit su
  `ops/run.trigger`. Un merge di PR via API **non** fa partire il workflow anche
  se tocca i path-trigger: serve un commit che modifica `ops/run.trigger`.
- **Squash-merge + continuare sullo STESSO branch ⇒ conflitti**: dopo aver
  squashato una PR, il branch diverge da `main`. Apri **un branch nuovo dalla
  `main` aggiornata** per ogni feature.
- **Confusione "template"**: in `next.json` il campo si chiama `stile` apposta;
  il template grafico WP ("Blog Post (Nuovo)" = `single-blog-nuovo.php`) lo
  mette lo script in automatico, non si tocca.
- **Niente MCP-server-di-prodotto** (valutato e scartato col PM: overkill, §13).
  Niente dipendenze/astrazioni "per il futuro". (Nota: i tool MCP di GitHub li
  usiamo solo come tramite git per via del rename, non è un pattern di prodotto.)
- **Flag Rank Math non-bug**: "keyword già usata" compariva se più post usavano
  la stessa focus keyword → mitigato dalla **rotazione tracciata** (non ripete i
  topic) + keyword tutte diverse in `topics.json`. Non è una regressione.
- **ToC e alt-immagini (check Rank Math che restano)**: il check "Table of
  Contents" vuole un **plugin** ToC attivo (non basta HTML); il check "keyword
  nell'alt" vuole immagini **nel corpo** (noi abbiamo solo la featured, il cui
  alt è già impostato). Entrambi non sono forzabili solo dallo script.

## 4. Profilo del PM (Daniel) — per tarare comunicazione e autonomia

- **Background**: termotecnica + BIM. Confidenza architetturale alta, **non
  legge codice/diff/log/stack-trace**. Ha **ottime intuizioni di prodotto** —
  verificarle, non liquidarle (ha individuato lui il problema dei titoli SEO,
  l'immagine dell'operaio "troppo finta", e che l'anti-bot era transitorio).
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
  WordPress in produzione oltre il flusso approvato (articoli programmati con
  veto). Daniel concede autorizzazioni a tempo ("pusha tu e fai merge"): valgono
  **fino al termine dell'obiettivo dichiarato**, poi si torna alla regola base.
- **Regole non negoziabili**: mai segreti nel codice; publish **programmato**
  (status `future` con veto), mai publish immediato (aggiornamento PM: prima era
  "solo draft"); il repo è **pubblico** (decisione PM: URL/email non sono
  segreti, le chiavi vivono nei GitHub Secrets).

## Riferimenti

- Metodo: `nove-c-kit` (PLAYBOOK.md = Costituzione; §13 lean, §32 audit
  contesto, §35 ops via Actions, §36 profilo PM).
- Stato vivo: `PROJECT_STATE.md`. Roadmap: `ROADMAP.md`. Operatività:
  `RUNBOOK.md`. Decisione strutturale: `docs/adr/0001`. Bootstrap: `CLAUDE.md`.
- Sorgente funzionale storica: `n8nesistente` (export JSON del flusso n8n).
