# RUNBOOK — Configurazione e run

## 1. Secret da configurare (una volta sola)

Repo → **Settings → Secrets and variables → Actions → New repository secret**.
Crea questi 4 secret (i valori NON vanno mai nel codice):

| Nome secret | Valore | Dove recuperarlo |
|---|---|---|
| `ANTHROPIC_API_KEY` | API key Anthropic | console.anthropic.com → API Keys |
| `BRAVE_API_KEY` | token Brave Search | api-dashboard.search.brave.com (header `X-Subscription-Token`) |
| `WP_USER` | utente WordPress | l'utente con cui pubblichi su nove-c.com |
| `WP_APP_PASSWORD` | **Application Password** WP | WP Admin → Utenti → Profilo → Application Passwords (NON la password di login) |

> Nota: `WP_APP_PASSWORD` è una password applicativa generata da WordPress
> (formato `xxxx xxxx xxxx xxxx`). Si incolla con gli spazi.

## 2. Run manuale (validazione MVP1)

Repo → tab **Actions** → workflow **NoveC SEO Blog** → **Run workflow**.
Al termine, nei log dello step "Genera articolo" trovi:
- la diagnostica SEO,
- il link admin alla bozza creata su WordPress.

Verifica: la bozza appare in WP (`nove-c.com/wp-admin`), categoria 3,
con focus keyword / titolo / meta description su Rank Math.

## 3. Run automatico

Parte da solo ogni **lunedì 02:00 UTC** (~03-04 ora italiana), cioè nella
notte tra domenica e lunedì. La bozza è pronta per la revisione del lunedì
mattina. Nessuna pubblicazione automatica: lo stato è sempre `draft`.

> GitHub disabilita i cron dopo 60 giorni di inattività del repo: se il repo
> resta fermo a lungo, riattiva il workflow dal tab Actions.
