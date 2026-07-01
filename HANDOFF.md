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
  titolo/meta, retry HTTP) → **Rank Math 80/100**, MVP4/**B1** (immagine +
  alt = focus keyword), **publish programmato + URL corta** (slug ≤60).
- **MVP2 (email) saltato** per scelta del PM. **Restano B2 (link interni reali),
  D1 (log storico), power word (config Rank Math); A3/A4 opzionali.**
- Tutto è su `main`. Branch **`mvp1.1`** = restore-point stabile (pre-MVP4).

## 2. Lavoro aperto (come riprendere)

Daniel **usa il sistema in produzione (rodaggio)**, raccoglie bug/feature e
vuole affrontarli **tutti insieme nella prossima release**. Backlog in
`PROJECT_STATE.md` → Next. In sintesi:
1. Bug/feature dal rodaggio (da raccogliere).
2. **Power word Rank Math**: Daniel aggiunge la lista power word ITALIANE nelle
   impostazioni di Rank Math (di default sono inglesi → il check resta rosso);
   poi allinea la lista `POWER_WORDS` nel codice a quella.
3. **MVP4**: ~~B1 immagini~~ FATTO. Restano **B2** link interni reali (dalla REST
   WP, al posto dei 2 fissi) e **D1** log storico. Aperto: quality immagine high
   vs medium; immagine anche nel corpo articolo.
4. **A3/A4** opzionali: quality gate SEO con rigenerazione (chiuderebbe il warning
   "densità bassa" su keyword lunghe); anti-doppioni (check slug su WP).

### Come funziona il sistema (così non chiedi a Daniel)

- **Codice**: tutto in un unico file **`generate.mjs`** (Node 20, **zero
  dipendenze npm**, solo `fetch` nativo). Eseguito da
  **`.github/workflows/seo-blog.yml`**.
- **Pipeline** (replica i 7 nodi n8n, l'export storico è in `n8nesistente`):
  scegli argomento → ricerca Brave → articolo con Claude (`claude-sonnet-4-6`,
  via **tool use** `pubblica_articolo`) → diagnostica SEO → [immagine OpenAI +
  upload WP] → crea post WP (`POST /wp-json/wp/v2/posts`, **`status:future`** +
  `date_gmt`, `categories:[3]`, `template:single-blog-nuovo.php`) → meta Rank Math
  (`POST /wp-json/rankmath/v1/updateMeta`).
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
  committare su `main` (è il modo "da git"; ora via MCP per via del rename).
- **Osservabilità**: ogni run scrive `ops/out/<timestamp>.log` e lo
  **ricommitta su `main`** (con `[skip ci]`) → leggi l'esito con `git pull`.
  Su **fallimento** il workflow apre **una issue GitHub** automatica (A2).
- **Garanzie SEO** (in `generate.mjs`): `buildSeoTitle()` forza la focus
  keyword a inizio titolo SEO + una power word; `ensureKwInMeta()` forza la
  focus keyword nella meta. Il **titolo visibile** del post resta naturale;
  si ottimizza solo il `<title>` (rank_math_title). `fetchJson()` ritenta su
  glitch transitori (5xx/429/HTML) ed esce con errori chiari.

### Verificare un run dell'agente

Dopo aver lanciato (commit su `ops/run.trigger` via MCP), aspetta il nuovo
file in `ops/out/` (poll con `git fetch`+`git ls-tree`; le letture funzionano),
poi `git pull` e leggi il log. Per le Actions puoi usare i tool MCP
`mcp__github__actions_list` / `get_job_logs` (lettura ok; **dispatch NO**, vedi sotto).

## 3. Cosa NON ripetere (trappole già pagate)

- **Repo rinominato `n8n`→`Blog-Bot-WP`**: `git push` fallisce (proxy sessione
  sul vecchio nome). Scrivi su GitHub **via MCP** (`push_files`/
  `create_or_update_file`/`delete_file`, con `repo:"n8n"` che redirige). Le
  letture (`git fetch`/`pull`) funzionano ancora. Trigger di un run = commit su
  `ops/run.trigger` via MCP (i commit API autore Daniel FANNO da trigger).
- **Anti-bot SiteGround (sgcaptcha)**: se un run fallisce con "risposta non-JSON
  `<html>...sgcaptcha...`" NON è il codice: è l'hosting che scambia le API per un
  bot quando ci sono **troppi run ravvicinati** (l'IP del runner viene flaggato).
  A cadenza normale (1/settimana) non scatta. Se stai testando: **dirada i run**
  (aspetta qualche minuto) e riprova. Fix durevole: whitelist `/wp-json/`
  nell'Anti-Bot di SiteGround. (Era la causa anche della vecchia issue #7.)
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
- **Flag Rank Math non-bug**: "keyword già usata" compare se più post usano
  la stessa focus keyword (artefatto dei run di test sulla stessa settimana).
  Non è una regressione.

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
