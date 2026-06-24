# Development Rules — Copilot Cowork Credits Estimator

> Queste regole sono **vincolanti** per ogni contributo al progetto. Vanno rispettate per **ogni
> Functional Point (FP)** e per ogni sezione/feature sviluppata.

---

## 🔴 Regola d'oro: Doc + Tour + i18n per OGNI FP

Per **ogni** FP o sezione funzionale che viene sviluppata, sono **sempre obbligatori** e parte della
"definition of done":

1. **Documentazione**
   - Aggiornare la **pagina Help in-app** (`src/pages/Help`) con la spiegazione della sezione.
   - Aggiornare la **guida utente** in [`docs/USER_GUIDE.md`](USER_GUIDE.md) (IT **e** EN).

2. **Tour guidato della sezione**
   - Aggiungere/estendere gli step del **tour guidato** per coprire i nuovi elementi UI.
   - Ancorare gli step con attributi `data-tour="<id>"` sugli elementi rilevanti.
   - Il tour della sezione deve poter essere **avviato** e **ri-avviato** dall'utente.

3. **Multilingua (i18n)**
   - **Tutte** le stringhe utente (UI, hint, tour, documentazione in-app) devono avere le chiavi
     i18n in **italiano (`it.json`)** e **inglese (`en.json`)**.
   - **Nessuna stringa hardcoded** visibile all'utente: passa sempre da `t('...')`.
   - Gli **hint contestuali** (`InfoHint`) sui valori/campi importanti vanno aggiunti e tradotti.

> ❌ Una FP **non è completa** se manca anche solo uno di questi tre elementi.

---

## Comportamento del tour guidato

- **Primo avvio**: il tour parte automaticamente una sola volta per browser (flag in `localStorage`,
  chiave `copilot_cowork_tour_seen_v1`).
- **Dismissione**: quando l'utente chiude/salta/completa il tour, il flag viene salvato e il tour
  **non riparte automaticamente** su quel browser.
- **Riavvio manuale**: deve essere **sempre disponibile** un comando per riavviare il tour
  (header globale + pagina Help).
- **Ri-dismissione**: se l'utente riavvia il tour manualmente e poi lo chiude di nuovo, il flag resta
  salvato → il tour resta dismesso. Riavviare il tour **non** rende il tour "non visto".

---

## Checklist per ogni Pull Request / FP

- [ ] Funzionalità implementata secondo l'analisi della FP.
- [ ] Stringhe utente tutte in `it.json` **e** `en.json` (nessun hardcoded).
- [ ] `InfoHint` aggiunti su KPI / campi / termini tecnici nuovi, tradotti.
- [ ] Step del tour aggiunti/aggiornati con `data-tour` anchor.
- [ ] Pagina Help in-app aggiornata.
- [ ] `docs/USER_GUIDE.md` aggiornato (IT + EN).
- [ ] `npm run type-check` pulito.
- [ ] `npm run lint` senza errori (warning di fast-refresh tollerati su file shadcn/ui).
- [ ] `npm run build` ok.

---

## Standard tecnici

- **Stack**: React 19 + TypeScript (strict) + Vite + Tailwind v4 + shadcn/ui + Zustand + react-i18next.
- **Versione**: unica fonte in `package.json`, iniettata a build-time (`__APP_VERSION__`).
- **Persistenza**: solo `localStorage` via `storageService`. Nessun backend.
- **Accessibilità**: componenti accessibili, navigabili da tastiera, label sui campi.
- **Naming**: coerente; logica di calcolo isolata in `engine/`, dati di sistema in `lib/systemData.ts`.
