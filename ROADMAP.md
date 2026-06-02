# ROADMAP — NoveC SEO Blog

> Definizione di prodotto a fasi. Ogni MVP ha un **obiettivo** e un **test
> di accettazione** ("fatto" quando..."). Filosofia: si chiude una fase
> prima di aprire la successiva (§16). Lo stato operativo vive in
> `PROJECT_STATE.md`; qui sta il **cosa** e il **perché**, non il giorno-giorno.

> **Stato (Release 1):** ✅ MVP1 · ✅ MVP1.1 · ⏭️ MVP2 saltato (scelta PM) ·
> ✅ MVP3 "slim" (A1+A2; A3/A4 opzionali) · ⬜ MVP4 rimandato. n8n dismesso.

## MVP1 — Bozza su WordPress (core) — ✅ FATTO

**Obiettivo:** il job gira da GitHub Actions ogni notte tra domenica e
lunedì e crea l'articolo come **bozza** su WP (`nove-c.com`, categoria 3)
con meta Rank Math impostati. Nessuna pubblicazione automatica.

**Test di accettazione:** lunedì mattina trovo in WP una bozza nuova,
categoria corretta, con titolo SEO + focus keyword + meta description su
Rank Math. Il run manuale (`workflow_dispatch`) produce lo stesso risultato.

**Scope:** replica 1:1 dei 7 nodi n8n (topic rotation → Brave → Claude →
parsing/diagnostica → POST bozza WP → Rank Math meta). Niente email.

## MVP2 — Notifica email (cosmesi)

**Obiettivo:** ricevere una mail di riepilogo quando la bozza è pronta.

**Test di accettazione:** dopo il run arriva a `danielcarta@nove-c.com` una
mail con titolo, slug, focus keyword, diagnostica SEO e link "apri in WP".

**Scope:** SMTP + App Password Gmail (o action di terze parti). Non
bloccante per MVP1.

## MVP3 — Robustezza + Controllo editoriale

**Obiettivo:** il flusso smette di rompersi in silenzio e Daniel guida i
contenuti senza toccare la logica.

**Test di accettazione:**
- Un output "sporco" o un errore di Claude/WP **non** crea una bozza rotta
  e **genera una notifica** (niente fallimento silenzioso).
- Un articolo sotto soglia SEO viene **rigenerato una volta** prima del salvataggio.
- Modifico `topics.json`, lancio il run, e l'articolo usa i nuovi topic.
- Un doppio run manuale **non** crea due bozze duplicate.

**Scope (MVP3 "slim" deciso dal PM — fatto A1 + A2; A3/A4 opzionali):**
- **A1** ✅ Output strutturato Claude via **tool use**: l'articolo arriva già
  come oggetto (tool_use.input), niente più strip fence / swap virgolette /
  JSON.parse del testo. Eliminata la fragilità del parsing.
- **A2** ✅ Su fallimento del run il workflow apre una **issue GitHub**
  (niente email, come da preferenza PM) con link al run + coda di log.
- **A3** _(opzionale, rimandato)_ Quality gate SEO: rigenera una volta se
  la diagnostica è sotto soglia.
- **A4** _(opzionale, rimandato)_ Anti-doppioni: check slug su WP prima di creare.
- ~~**C1** `topics.json` editabile~~ → anticipato a **MVP1.1** (fatto).
- ~~**C2** override one-off della rotazione~~ → anticipato a **MVP1.1**
  (`next.json` auto-svuotante, fatto).

## MVP4 — Arricchimento contenuto

**Obiettivo:** alzare la qualità SEO e visiva dell'articolo.

**Test di accettazione:** la bozza ha una featured image coerente, contiene
link interni a post WP **reali** esistenti, ed esiste un log storico degli
articoli generati.

**Scope:**
- **B1** Immagini: featured image generata (AI) o scelta da libreria →
  upload su WP, al posto dell'ID hardcoded `5026`.
- **B2** Link interni reali: pescati via REST dagli articoli esistenti su
  `nove-c.com`, al posto dei 2 URL fissi.
- **D1** Log storico: riepilogo nel summary della Action + CSV degli
  articoli generati committato nel repo (§35 auto-commit log).

## Fuori scope (anti-overengineering, §13)

Dashboard, database, multi-utente, A/B testing dei titoli, coda di
pubblicazione complessa. Per un articolo a settimana è sproporzionato.
Si riapre solo con dolore presente chiaro e quantificato.
