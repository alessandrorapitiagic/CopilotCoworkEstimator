# User Guide — Copilot Cowork Credits Estimator

> 🇮🇹 Versione italiana sotto la sezione inglese · 🇬🇧 English version first.

---

## 🇬🇧 English

### What is this app?

**Copilot Cowork Credits Estimator** is a static, browser-only planning tool that estimates the
consumption and cost of **Microsoft Copilot Cowork Credits** for an organization.

Key principles:

- **No backend, no login, no tracking** — everything runs in your browser.
- **Local-first** — all data is stored in `localStorage`. Export a JSON backup regularly.
- **Transparent estimates** — results are a `min / mid / max` range based on editable assumption
  packs, **not** official Microsoft pricing.

### First run

On the very first launch a **guided tour** starts automatically and walks you through the main areas
of the app. You can:

- **Skip** it at any time.
- **Restart** it later from **Help → Start guided tour**.

### Quick start (4 steps)

1. **Create a company** — go to **Companies → New Company**, set a name and the number of employees.
2. **Create a scenario** — start a **New Scenario**, pick the company and add workforce segments
   (e.g. Sales, IT, Managers).
3. **Configure segments** — for each segment set headcount, *enabled* and *active* user
   percentages, a usage profile and the preferred AI model.
4. **Read the results** — the scenario automatically computes monthly/annual credits and cost as a
   `min / mid / max` range with a per-segment breakdown.

### Key concepts

| Concept | Meaning |
| --- | --- |
| **Copilot Credits** | Consumption unit of the Cowork model. Each task consumes credits based on model, context, tools and complexity. |
| **min / mid / max range** | Estimates are an interval, not a single number. The **midpoint** is the main value; min and max show best/worst case. |
| **Usage profile** | *Light / Medium / Heavy* describe how intensively a segment uses Copilot each month. Custom profiles are supported. |
| **Assumption Pack** | A versioned set of calculation rules (credit bands, model factors). Kept separate from company data and updatable. |
| **Funding plan** | How credits are priced (PAYG, prepaid, existing capacity, blended). Changes the *cost*, not the *credit* consumption. |

### Contextual hints

Throughout the UI you'll find small **info icons (ⓘ)** next to values and form fields. Hover (or
focus with the keyboard) to see a short explanation. All hints are available in **Italian and
English**.

### Themes & language

- Toggle **light / dark / system** theme from the sidebar (or **Settings**).
- Switch between **Italian** and **English** at any time. The choice is persisted.

### Data management

From **Settings → Data Management** you can:

- **Export All** — download a full JSON backup of companies, scenarios and custom assumptions.
- **Import All** — restore from a JSON backup.
- **Reset Data** — permanently delete all local data (asks for confirmation).

> ⚠️ Clearing your browser data deletes your simulations. Export a backup before clearing.

### Scenario report

Open **Scenario → Report** to generate the final printable view for a simulation. The report includes
executive summary, company data, scenario configuration, min/mid/max credit and cost estimates,
funding plan, budget guardrails, segment breakdown, assumptions, calculation formula, warnings,
metadata and the estimation disclaimer.

Use **Print / PDF** to save a PDF from the browser print dialog. You can also export summary CSV,
segment CSV, report JSON, or share the scenario via link.

### Disclaimer

All results are **planning estimates** based on assumptions. They **do not** represent an official
Microsoft quote or a contractual price.

---

## 🇮🇹 Italiano

### Cos'è questa app?

**Copilot Cowork Credits Estimator** è uno strumento di pianificazione statico, che funziona solo
nel browser, per stimare il consumo e il costo dei **Microsoft Copilot Cowork Credits** di
un'organizzazione.

Principi chiave:

- **Nessun backend, nessun login, nessun tracciamento** — tutto gira nel tuo browser.
- **Local-first** — tutti i dati sono salvati in `localStorage`. Esporta un backup JSON con
  regolarità.
- **Stime trasparenti** — i risultati sono un intervallo `min / mid / max` basato su assumption pack
  modificabili, **non** un prezzo ufficiale Microsoft.

### Primo avvio

Al primissimo avvio parte automaticamente un **tour guidato** che ti accompagna nelle aree principali
dell'app. Puoi:

- **Saltarlo** in qualsiasi momento.
- **Riavviarlo** in seguito da **Guida → Avvia il tour guidato**.

### Avvio rapido (4 passi)

1. **Crea un'azienda** — vai in **Aziende → Nuova Azienda**, imposta nome e numero di dipendenti.
2. **Crea uno scenario** — avvia un **Nuovo Scenario**, scegli l'azienda e aggiungi i segmenti della
   forza lavoro (es. Sales, IT, Manager).
3. **Configura i segmenti** — per ogni segmento imposta numero persone, percentuali di utenti
   *abilitati* e *attivi*, un profilo di utilizzo e il modello AI preferito.
4. **Leggi i risultati** — lo scenario calcola automaticamente crediti e costi mensili/annuali come
   intervallo `min / mid / max` con breakdown per segmento.

### Concetti chiave

| Concetto | Significato |
| --- | --- |
| **Copilot Credits** | Unità di consumo del modello Cowork. Ogni task consuma crediti in base a modello, contesto, tool e complessità. |
| **range min / mid / max** | Le stime sono un intervallo, non un numero singolo. Il **midpoint** è il valore principale; min e max mostrano caso migliore/peggiore. |
| **Profilo di utilizzo** | *Light / Medium / Heavy* descrivono quanto intensamente un segmento usa Copilot ogni mese. Sono supportati profili personalizzati. |
| **Assumption Pack** | Insieme versionato di regole di calcolo (bande crediti, fattori modello). Separato dai dati aziendali e aggiornabile. |
| **Piano di finanziamento** | Come vengono valorizzati i crediti (PAYG, prepagato, capacità esistente, blended). Cambia il *costo*, non il *consumo* di crediti. |

### Hint contestuali

In tutta l'interfaccia trovi piccole **icone info (ⓘ)** accanto a valori e campi dei form. Passa col
mouse (o metti il focus da tastiera) per vedere una breve spiegazione. Tutti gli hint sono disponibili
in **italiano e inglese**.

### Tema e lingua

- Cambia tema **chiaro / scuro / sistema** dalla sidebar (o da **Impostazioni**).
- Passa tra **italiano** e **inglese** in qualsiasi momento. La scelta viene salvata.

### Gestione dati

Da **Impostazioni → Gestione Dati** puoi:

- **Esporta Tutto** — scarica un backup JSON completo di aziende, scenari e assunzioni personalizzate.
- **Importa Tutto** — ripristina da un backup JSON.
- **Reset Dati** — elimina permanentemente tutti i dati locali (chiede conferma).

> ⚠️ Cancellare i dati del browser elimina le simulazioni. Esporta un backup prima di farlo.

### Report scenario

Apri **Scenario → Report** per generare la vista finale stampabile di una simulazione. Il report
include executive summary, dati azienda, configurazione scenario, stime min/mid/max di crediti e
costi, funding plan, budget guardrails, breakdown segmenti, assunzioni, formula di calcolo, warning,
metadata e disclaimer.

Usa **Stampa / PDF** per salvare un PDF dalla finestra di stampa del browser. Puoi anche esportare
CSV riepilogo, CSV segmenti, JSON report o condividere lo scenario tramite link.

### Disclaimer

Tutti i risultati sono **stime di pianificazione** basate su assunzioni. **Non** rappresentano un
preventivo ufficiale Microsoft né un prezzo contrattuale.
