# Analisi funzionale

## Microsoft Copilot Cowork Credits Estimator

---

# 1. Scopo del documento

Questo documento descrive l’analisi funzionale della web app **Microsoft Copilot Cowork Credits Estimator**, uno strumento statico pensato per stimare il consumo e il costo dei **Copilot Cowork Credits** per aziende, scenari di adozione, categorie di utenti, profili di utilizzo e modelli AI differenti.

L’obiettivo è progettare un’applicazione utilizzabile da consulenti, solution architect, sales specialist e team interni per:

* creare simulazioni di costo per aziende diverse;
* modellare la composizione della forza lavoro;
* stimare il consumo mensile e annuale di Copilot Credits;
* confrontare scenari alternativi;
* rendere esplicite tutte le assunzioni di calcolo;
* salvare, esportare, importare e condividere le simulazioni;
* mantenere il tutto in una static app deployabile su GitHub Pages, senza backend.

---

# 2. Contesto funzionale

Microsoft Copilot Cowork introduce un modello di consumo basato su **Copilot Credits**. Il costo non è semplicemente legato alla licenza Microsoft 365 Copilot, ma viene stimato e fatturato in base all’utilizzo effettivo.

Dalla ricerca emerge che il consumo dei crediti dipende da variabili come:

* modello utilizzato;
* quantità e complessità del contesto;
* strumenti o tool invocati;
* runtime dell’operazione;
* tipologia di task;
* eventuale uso di browser, immagini, workflow multi-step o agenti.

Microsoft fornisce bande indicative di consumo per task light, medium e heavy, ma non una formula pubblica deterministica per ogni singolo modello. Per questo motivo l’app non deve comportarsi come un motore di preventivazione contrattuale, ma come un **planning estimator trasparente, modificabile e versionato**.

---

# 3. Obiettivi del prodotto

L’app deve permettere all’utente di stimare il costo Cowork partendo da dati organizzativi e scenari di utilizzo realistici.

Gli obiettivi principali sono:

1. **Stimare il consumo di crediti**

   * Per azienda.
   * Per scenario.
   * Per categoria di utenti.
   * Per modello AI.
   * Per intensità di utilizzo.
   * Per task type.

2. **Stimare il costo economico**

   * Costo mensile.
   * Costo annuale.
   * Costo per utente abilitato.
   * Costo per utente attivo.
   * Costo per categoria.
   * Costo per scenario.
   * Costo con PAYG.
   * Costo con piani prepagati o scontati.

3. **Gestire scenari multipli**

   * Scenario conservativo.
   * Scenario realistico.
   * Scenario aggressivo.
   * Scenario custom.
   * Scenario per singola azienda.
   * Portfolio di aziende.

4. **Rendere tracciabili le assunzioni**

   * Versione dell’assumption pack.
   * Fonte della logica di calcolo.
   * Data di aggiornamento.
   * Bande ufficiali note.
   * Valori custom inseriti dall’utente.
   * Avvisi quando il dato è stimato e non ufficiale.

5. **Supportare lavoro consulenziale**

   * Salvataggio locale di aziende e simulazioni.
   * Export CSV.
   * Export JSON.
   * Import JSON.
   * Link condivisibile.
   * Confronto scenari.
   * Riepilogo leggibile per presentazioni o discussioni commerciali.

---

# 4. Ambito applicativo

## 4.1 In scope

Sono incluse nel perimetro della prima versione:

* dashboard iniziale;
* gestione aziende;
* gestione segmenti di popolazione aziendale;
* gestione scenari;
* gestione profili di utilizzo light/medium/heavy/custom;
* gestione task preset;
* gestione modelli AI e assumption pack;
* calcolo crediti;
* calcolo costi;
* confronto scenari;
* salvataggio in localStorage;
* export CSV;
* export JSON;
* import JSON;
* condivisione tramite link;
* pannello “How this was calculated”;
* validazioni input;
* alert su assunzioni incomplete o incoerenti;
* deploy statico su GitHub Pages.

## 4.2 Out of scope

Non sono inclusi nella prima versione:

* autenticazione utenti;
* gestione multiutente reale;
* backend;
* database remoto;
* login Microsoft;
* integrazione diretta con Microsoft 365 Admin Center;
* lettura automatica dei consumi reali dal tenant;
* sincronizzazione cloud;
* preventivo contrattuale ufficiale;
* pagamento o billing reale;
* generazione automatica di offerte commerciali vincolanti.

## 4.3 Possibili evoluzioni future

In release successive si potrà valutare:

* import da template Excel;
* generazione PDF;
* dashboard portfolio avanzata;
* confronto tra assumption pack;
* gestione valute;
* supporto multilingua;
* simulazione phased rollout;
* grafici avanzati;
* integrazione opzionale con API Microsoft, se disponibili;
* benchmarking tra uso stimato e uso reale.

---

# 5. Attori e ruoli

## 5.1 Utente consulente

È il principale utilizzatore dell’app.

Può:

* creare aziende;
* creare scenari;
* stimare costi;
* modificare assunzioni;
* esportare dati;
* condividere simulazioni;
* confrontare scenari;
* usare l’app durante workshop o incontri commerciali.

## 5.2 Solution architect

Usa l’app per modellare scenari tecnici più dettagliati.

Può:

* modificare driver di consumo;
* impostare modelli AI;
* configurare task complessi;
* creare profili custom;
* validare ipotesi di consumo;
* spiegare il breakdown al cliente.

## 5.3 Sales / account manager

Usa l’app per una stima commerciale preliminare.

Può:

* partire da template predefiniti;
* generare stime rapide;
* esportare risultati sintetici;
* confrontare scenari conservativo/realistico/aggressivo;
* condividere il risultato con il cliente.

## 5.4 Cliente finale

Può ricevere un link o un export.

Può:

* visualizzare la simulazione;
* modificare i dati, se riceve la configurazione editabile;
* comprendere le assunzioni;
* usare il report come base decisionale.

---

# 6. Oggetti principali del dominio

## 6.1 Company

Rappresenta un’azienda o un cliente.

Campi principali:

* `id`
* `name`
* `industry`
* `country`
* `description`
* `totalEmployees`
* `createdAt`
* `updatedAt`
* `tags`
* `notes`

Regole:

* il nome azienda è obbligatorio;
* il numero totale dipendenti deve essere maggiore di zero;
* la somma dei segmenti non deve superare il totale dipendenti, salvo warning esplicito;
* una company può avere più scenari collegati.

---

## 6.2 Workforce Segment

Rappresenta una categoria di utenti.

Esempi:

* manager;
* dirigenti;
* white collar;
* blue collar;
* sales;
* HR;
* legal;
* finance;
* operations;
* field workers;
* IT;
* customer care;
* custom category.

Campi principali:

* `id`
* `companyId`
* `name`
* `headcount`
* `enabledPercentage`
* `activeUsagePercentage`
* `usageProfileId`
* `preferredModelId`
* `taskMix`
* `notes`

Regole:

* il nome segmento è obbligatorio;
* l’headcount deve essere maggiore o uguale a zero;
* le percentuali devono essere comprese tra 0 e 100;
* ogni segmento deve avere almeno un profilo di utilizzo associato;
* i segmenti devono essere modificabili, duplicabili ed eliminabili.

---

## 6.3 Usage Profile

Rappresenta il comportamento medio di utilizzo.

Profili standard:

* Light;
* Medium;
* Heavy.

Profili custom:

* creati dall’utente;
* salvati localmente;
* riutilizzabili in più scenari.

Campi principali:

* `id`
* `name`
* `description`
* `lightTasksPerUserPerMonth`
* `mediumTasksPerUserPerMonth`
* `heavyTasksPerUserPerMonth`
* `defaultModelId`
* `contextFactor`
* `toolsFactor`
* `runtimeFactor`
* `browserFactor`
* `imageFactor`
* `isSystemDefault`
* `createdAt`
* `updatedAt`

Regole:

* i profili di sistema non devono essere eliminabili;
* i profili di sistema possono essere duplicati;
* i profili custom possono essere modificati o cancellati;
* ogni profilo deve indicare il mix mensile atteso di task.

---

## 6.4 Task Preset

Rappresenta una tipologia di attività AI.

Esempi:

* simple prompt;
* summarization;
* document analysis;
* deep research;
* agent workflow;
* customer support automation;
* legal review;
* sales research;
* report generation;
* data extraction;
* browser-based research;
* image generation.

Campi principali:

* `id`
* `name`
* `description`
* `intensity`
* `defaultCreditsMin`
* `defaultCreditsMid`
* `defaultCreditsMax`
* `recommendedModels`
* `contextComplexity`
* `toolsUsage`
* `runtimeComplexity`
* `browserUsage`
* `imageUsage`
* `notes`

Regole:

* ogni task preset deve avere una classe di intensità;
* ogni task preset può avere più modelli consigliati;
* l’utente può modificare i task custom;
* i task di sistema devono essere versionati.

---

## 6.5 Model Assumption

Rappresenta un modello disponibile o stimabile.

Esempi:

* Auto;
* Claude Sonnet 4.6;
* Claude Opus 4.8;
* Sonnet + Opus Advisor;
* GPT 5.5 Frontier;
* Imagen 2;
* Cowork 1 placeholder.

Campi principali:

* `id`
* `name`
* `provider`
* `description`
* `modelClass`
* `modelFactor`
* `inputWeight`
* `outputWeight`
* `recommendedFor`
* `availabilityNotes`
* `isOfficiallyDocumented`
* `isEditable`

Regole:

* il modello Auto deve essere sempre disponibile;
* i model factor devono essere modificabili negli assumption pack custom;
* il sistema deve mostrare un warning se il modello non ha pricing ufficiale deterministico;
* i modelli possono essere abilitati o disabilitati dall’utente in base al contesto cliente.

---

## 6.6 Assumption Pack

Rappresenta un insieme versionato di regole di calcolo.

Campi principali:

* `id`
* `name`
* `version`
* `source`
* `sourceDate`
* `description`
* `creditBands`
* `modelFactors`
* `contextFactors`
* `toolsFactors`
* `runtimeFactors`
* `fundingDefaults`
* `isSystemDefault`
* `createdAt`
* `updatedAt`

Tipologie iniziali:

1. **Official range mode**

   * usa bande light/medium/heavy;
   * produce minimo, midpoint e massimo;
   * indica chiaramente che è una stima.

2. **Point estimate mode**

   * usa valori puntuali scelti dall’utente;
   * utile per simulazioni commerciali rapide.

3. **Custom assumption mode**

   * creato e modificato dall’utente;
   * salvato localmente;
   * esportabile/importabile.

Regole:

* ogni scenario deve referenziare un assumption pack;
* ogni risultato deve mostrare quale assumption pack è stato usato;
* se l’assumption pack viene modificato, lo scenario deve poter:

  * mantenere i vecchi valori;
  * aggiornarsi alla nuova versione;
  * duplicarsi con la nuova versione.

---

## 6.7 Funding Plan

Rappresenta la modalità economica di valorizzazione dei crediti.

Campi principali:

* `id`
* `scenarioId`
* `mode`
* `paygPricePerCredit`
* `prepaidCredits`
* `prepaidEffectivePricePerCredit`
* `existingMonthlyCredits`
* `discountPercentage`
* `currency`
* `notes`

Modalità iniziali:

* PAYG;
* Prepaid tier;
* Existing capacity;
* Blended.

Regole:

* il PAYG deve avere un valore predefinito modificabile;
* il piano prepaid deve calcolare il costo effettivo per credito;
* la existing capacity deve essere sottratta prima del costo extra;
* il blended mode deve mostrare parte coperta e parte eccedente.

---

## 6.8 Scenario

Rappresenta una simulazione.

Campi principali:

* `id`
* `companyId`
* `name`
* `description`
* `assumptionPackId`
* `fundingPlanId`
* `segments`
* `calculationResult`
* `createdAt`
* `updatedAt`
* `status`
* `tags`

Stati suggeriti:

* Draft;
* Reviewed;
* Shared;
* Archived.

Regole:

* ogni scenario appartiene a una company;
* ogni scenario deve essere salvabile;
* ogni scenario deve essere duplicabile;
* ogni scenario deve essere confrontabile con altri scenari della stessa company;
* uno scenario archiviato non deve essere eliminato accidentalmente senza conferma.

---

## 6.9 Calculation Result

Rappresenta il risultato numerico calcolato.

Campi principali:

* `scenarioId`
* `monthlyCreditsMin`
* `monthlyCreditsMid`
* `monthlyCreditsMax`
* `annualCreditsMin`
* `annualCreditsMid`
* `annualCreditsMax`
* `monthlyCostMin`
* `monthlyCostMid`
* `monthlyCostMax`
* `annualCostMin`
* `annualCostMid`
* `annualCostMax`
* `costPerEnabledUser`
* `costPerActiveUser`
* `breakdownBySegment`
* `breakdownByModel`
* `breakdownByIntensity`
* `warnings`
* `calculatedAt`

Regole:

* il risultato deve essere ricalcolato automaticamente a ogni modifica;
* il risultato deve essere tracciabile;
* il risultato deve sempre mostrare se è range-based o point-based;
* il risultato deve includere warning sulle assunzioni.

---

# 7. Functional points

## FP-001 — Dashboard iniziale

### Obiettivo

Fornire una vista sintetica dell’attività dell’utente: aziende salvate, scenari recenti, costi stimati, warning e azioni rapide.

### Funzionalità

La dashboard deve mostrare:

* numero aziende salvate;
* numero scenari creati;
* ultimi scenari modificati;
* costo mensile stimato aggregato;
* costo annuale stimato aggregato;
* scenario più costoso;
* scenario più recente;
* eventuali assumption pack obsoleti;
* pulsanti rapidi:

  * nuova azienda;
  * nuovo scenario;
  * importa JSON;
  * esporta portfolio.

### Input

* dati salvati in localStorage;
* lista company;
* lista scenario;
* risultati calcolo.

### Output

* card riepilogative;
* tabella ultimi scenari;
* alert;
* shortcut operativi.

### Regole

* se non esistono aziende, mostrare empty state guidato;
* se non esistono scenari, proporre creazione guidata;
* se sono presenti scenari con assumption pack vecchi, mostrare alert;
* i valori aggregati devono usare il midpoint come default, ma permettere switch min/mid/max.

### Criteri di accettazione

* L’utente vede subito se ha già simulazioni salvate.
* L’utente può iniziare una nuova simulazione in massimo un click.
* L’utente visualizza eventuali warning sulle assunzioni obsolete.
* La dashboard funziona anche con zero dati.

---

## FP-002 — Gestione aziende

### Obiettivo

Consentire all’utente di creare, modificare, duplicare, archiviare ed eliminare aziende.

### Funzionalità

L’utente deve poter:

* creare una nuova company;
* inserire nome, settore, paese e numero dipendenti;
* aggiungere note;
* modificare dati esistenti;
* duplicare una company con o senza scenari;
* archiviare una company;
* eliminare una company;
* visualizzare scenari associati.

### Input

* nome azienda;
* settore;
* paese;
* totale dipendenti;
* note;
* tag.

### Output

* scheda azienda;
* lista scenari collegati;
* metriche aggregate.

### Regole

* il nome azienda è obbligatorio;
* totale dipendenti deve essere maggiore di zero;
* eliminare una company deve richiedere conferma;
* se una company ha scenari associati, l’utente deve scegliere se eliminare anche gli scenari o annullare;
* l’archiviazione non deve cancellare dati.

### Criteri di accettazione

* L’utente può creare un’azienda valida.
* L’utente non può salvare un’azienda senza nome.
* L’utente riceve warning se i segmenti superano il totale dipendenti.
* L’utente può duplicare un’azienda mantenendo o rimuovendo gli scenari.

---

## FP-003 — Segmentazione workforce

### Obiettivo

Consentire la modellazione della popolazione aziendale in categorie flessibili.

### Funzionalità

L’utente deve poter creare segmenti come:

* manager;
* white collar;
* blue collar;
* sales;
* HR;
* legal;
* field workers;
* custom.

Per ogni segmento deve poter definire:

* nome;
* numero persone;
* percentuale utenti abilitati;
* percentuale utenti attivi;
* profilo di utilizzo;
* modello preferito;
* mix di task;
* note.

### Input

* segment name;
* headcount;
* enabled percentage;
* active percentage;
* usage profile;
* model;
* task mix.

### Output

* tabella segmenti;
* totale headcount segmentato;
* differenza rispetto al totale azienda;
* crediti stimati per segmento;
* costo stimato per segmento.

### Regole

* la somma dei segmenti non dovrebbe superare il totale azienda;
* se la somma è inferiore, mostrare popolazione non classificata;
* se la somma è superiore, mostrare warning bloccante o semi-bloccante;
* percentuale utenti abilitati e attivi devono essere 0–100;
* utenti attivi non possono superare utenti abilitati in valore assoluto;
* un segmento con zero utenti deve essere consentito ma escluso dal calcolo.

### Criteri di accettazione

* L’utente può rappresentare aziende semplici e complesse.
* È possibile aggiungere categorie non previste.
* Il sistema segnala errori di somma e percentuali incoerenti.
* Ogni segmento produce un breakdown di costo.

---

## FP-004 — Wizard guidato per nuovo scenario

### Obiettivo

Guidare l’utente nella creazione di una simulazione end-to-end.

### Step del wizard

1. Selezione o creazione azienda.
2. Definizione workforce.
3. Scelta assumption pack.
4. Scelta profilo di utilizzo.
5. Scelta modelli.
6. Definizione funding plan.
7. Review risultato.
8. Salvataggio scenario.

### Funzionalità

* navigazione step-by-step;
* salvataggio automatico bozza;
* possibilità di tornare indietro;
* validazioni progressive;
* riepilogo finale;
* creazione scenario.

### Regole

* l’utente non deve perdere dati se cambia step;
* gli step con errori devono essere evidenziati;
* il wizard può essere completato solo se i dati minimi sono validi;
* ogni scenario creato deve avere nome, azienda e assumption pack.

### Criteri di accettazione

* Un utente nuovo riesce a creare una stima senza conoscere la struttura dati.
* Ogni passaggio espone solo le informazioni necessarie.
* Il risultato è calcolato prima del salvataggio finale.
* Una bozza interrotta può essere recuperata.

---

## FP-005 — Gestione profili di utilizzo

### Obiettivo

Permettere di definire come ogni tipologia di utente consuma Cowork.

### Profili standard

#### Light

Uso occasionale, task semplici, bassa frequenza.

Esempi:

* prompt semplici;
* brevi riassunti;
* bozze email;
* classificazioni leggere.

#### Medium

Uso ricorrente, task articolati, più richieste mensili.

Esempi:

* analisi documenti;
* report operativi;
* supporto decisionale;
* task multi-step semplici.

#### Heavy

Uso intensivo, task complessi, workflow avanzati.

Esempi:

* deep research;
* agenti;
* analisi complesse;
* document review;
* workflow multi-step;
* uso frequente di tool.

### Funzionalità

L’utente deve poter:

* visualizzare profili standard;
* duplicare profili standard;
* creare profili custom;
* modificare task mensili per utente;
* modificare fattori di consumo;
* associare profili ai segmenti;
* eliminare profili custom.

### Input

* nome profilo;
* descrizione;
* numero task light/mese;
* numero task medium/mese;
* numero task heavy/mese;
* modello default;
* fattori correttivi.

### Output

* lista profili;
* preview consumo medio;
* impatto stimato sullo scenario.

### Regole

* i profili standard non devono essere eliminabili;
* i profili custom devono essere esportabili;
* modificando un profilo usato in uno scenario, l’app deve chiedere se aggiornare gli scenari collegati o creare una copia;
* i valori negativi non sono ammessi.

### Criteri di accettazione

* L’utente può creare un profilo personalizzato.
* Il profilo può essere associato a uno o più segmenti.
* Le modifiche hanno impatto visibile sul calcolo.
* I profili standard restano sempre disponibili.

---

## FP-006 — Gestione task preset

### Obiettivo

Permettere di stimare il consumo partendo da tipologie di task riconoscibili.

### Task preset iniziali

* Simple prompt;
* Document summarization;
* Document analysis;
* Deep research;
* Agent task;
* Multi-step workflow;
* Customer support automation;
* Sales research;
* Legal document review;
* HR policy analysis;
* Data extraction;
* Report generation;
* Browser-based research;
* Image generation.

### Funzionalità

Per ogni task preset l’utente deve poter vedere:

* descrizione;
* intensità;
* crediti min/mid/max;
* modelli consigliati;
* driver di costo;
* note sulle assunzioni.

L’utente deve poter:

* duplicare preset;
* creare preset custom;
* modificare valori;
* eliminare preset custom;
* usare preset nel mix di un segmento.

### Regole

* i preset standard sono protetti;
* i preset custom sono editabili;
* ogni preset deve appartenere a una classe light, medium o heavy;
* se un preset usa image generation o browser task, deve comparire un warning di potenziale consumo aggiuntivo;
* ogni preset deve avere almeno un valore di credito.

### Criteri di accettazione

* L’utente può creare una stima non solo per profilo utente, ma anche per task.
* I task preset spiegano il perché del loro consumo.
* I task custom vengono salvati e riutilizzati.
* Il breakdown mostra il contributo dei task.

---

## FP-007 — Gestione modelli AI

### Obiettivo

Consentire di modellare l’impatto dei diversi modelli disponibili o stimabili.

### Modelli iniziali

* Auto;
* Claude Sonnet 4.6;
* Claude Opus 4.8;
* Sonnet + Opus Advisor;
* GPT 5.5 Frontier;
* Imagen 2;
* Cowork 1 placeholder.

### Funzionalità

L’utente deve poter:

* visualizzare modelli disponibili;
* leggere descrizione e use case consigliati;
* abilitare/disabilitare modelli per scenario;
* associare modello a segmento;
* associare modello a task;
* modificare model factor negli assumption pack custom;
* vedere warning dove il pricing non è ufficiale.

### Regole

* Auto è il modello default;
* i fattori modello sono assunzioni modificabili;
* non bisogna presentare i factor come pricing ufficiale;
* se un modello viene disabilitato, i segmenti che lo usano devono essere riassegnati;
* Imagen 2 deve essere considerato solo per task image-related.

### Criteri di accettazione

* L’utente capisce che il modello impatta la stima.
* I model factor sono trasparenti.
* Il sistema non dichiara un costo ufficiale non pubblicato.
* Il breakdown per modello è disponibile nel risultato.

---

## FP-008 — Assumption pack versionati

### Obiettivo

Separare la logica di stima dai dati aziendali, rendendo le assunzioni aggiornabili e auditabili.

### Funzionalità

L’app deve includere assumption pack di sistema e custom.

Ogni assumption pack deve contenere:

* nome;
* versione;
* data fonte;
* descrizione;
* bande light/medium/heavy;
* fattori modello;
* fattori contesto;
* fattori tool;
* fattori runtime;
* note e disclaimer.

L’utente deve poter:

* consultare assumption pack;
* duplicare assumption pack;
* creare versione custom;
* modificare valori custom;
* selezionare pack per scenario;
* confrontare risultato tra due pack.

### Regole

* i pack di sistema non devono essere modificabili direttamente;
* ogni scenario deve referenziare il pack usato;
* se il pack cambia, il sistema deve mantenere auditabilità;
* i pack custom devono essere esportabili/importabili;
* ogni pack deve avere versione e data.

### Criteri di accettazione

* Ogni stima è riconducibile a una versione di assunzioni.
* L’utente può aggiornare le assunzioni senza rompere scenari vecchi.
* È possibile confrontare lo stesso scenario con pack diversi.
* Il sistema mostra chiaramente quando un pack è custom.

---

## FP-009 — Funding plan e valorizzazione economica

### Obiettivo

Calcolare il valore economico dei crediti consumati.

### Modalità supportate

1. PAYG.
2. Prepaid tier.
3. Existing capacity.
4. Blended mode.

### Funzionalità

L’utente deve poter impostare:

* prezzo per credito;
* valuta;
* sconto;
* crediti prepagati;
* crediti già disponibili;
* soglia mensile;
* budget target;
* modalità di valorizzazione.

### Output

* costo mensile min/mid/max;
* costo annuale min/mid/max;
* parte coperta da crediti esistenti;
* parte eccedente;
* costo netto;
* risparmio stimato rispetto a PAYG.

### Regole

* existing capacity viene consumata prima del PAYG;
* se i crediti stimati superano la capacità disponibile, mostrare spillover;
* gli sconti devono essere applicati solo se il funding plan lo prevede;
* il prezzo per credito deve essere modificabile;
* la valuta deve essere visualizzata in modo coerente.

### Criteri di accettazione

* L’utente può stimare sia crediti sia valore economico.
* Il calcolo distingue PAYG e prepaid.
* Il sistema evidenzia eccedenze.
* Il funding plan è incluso nell’export.

---

## FP-010 — Motore di calcolo

### Obiettivo

Calcolare crediti e costi in modo coerente, trasparente e ripetibile.

### Formula base

Per ogni segmento:

`enabledUsers = headcount × enabledPercentage`

`activeUsers = enabledUsers × activeUsagePercentage`

`monthlyTasks = activeUsers × tasksPerActiveUserPerMonth`

`baseCredits = monthlyTasks × creditsPerTask`

`adjustedCredits = baseCredits × modelFactor × contextFactor × toolsFactor × runtimeFactor × browserFactor × imageFactor`

Per ogni scenario:

`totalMonthlyCredits = sum(adjustedCredits for all segments)`

`totalAnnualCredits = totalMonthlyCredits × 12`

`monthlyCost = billableCredits × effectivePricePerCredit`

`annualCost = monthlyCost × 12`

### Range calculation

Il sistema deve calcolare:

* minimo;
* midpoint;
* massimo.

Per task heavy dove è nota solo una soglia minima, il sistema deve usare:

* valore minimo ufficiale;
* valore midpoint configurato nell’assumption pack;
* valore massimo configurato nell’assumption pack.

### Output

* crediti mensili;
* crediti annuali;
* costo mensile;
* costo annuale;
* costo per segmento;
* costo per utente abilitato;
* costo per utente attivo;
* costo per modello;
* costo per intensità;
* warning.

### Regole

* il calcolo deve essere deterministicamente ripetibile;
* ogni risultato deve essere ricalcolabile dagli input;
* i valori arrotondati non devono alterare il calcolo interno;
* la UI può mostrare due decimali, ma il motore deve mantenere precisione maggiore;
* i warning devono essere generati dal motore, non solo dalla UI.

### Criteri di accettazione

* Lo stesso input produce sempre lo stesso output.
* La formula è visibile all’utente.
* Ogni breakdown somma al totale.
* Il sistema produce range e non solo valore puntuale.

---

## FP-011 — Breakdown risultati

### Obiettivo

Mostrare all’utente non solo il totale, ma la composizione del costo.

### Breakdown richiesti

* per segmento;
* per modello;
* per intensità;
* per task preset;
* per funding plan;
* per mese;
* per anno.

### Componenti UI

* card riepilogative;
* tabella segmenti;
* grafico crediti per segmento;
* grafico costo per segmento;
* tabella modelli;
* tabella funding;
* alert budget;
* pannello dettaglio formula.

### Regole

* il midpoint è il valore principale;
* min e max devono essere sempre accessibili;
* i breakdown devono essere coerenti con il totale;
* i valori devono essere esportabili;
* in caso di dati mancanti, mostrare warning e non risultato falso.

### Criteri di accettazione

* L’utente capisce quali segmenti generano più costo.
* L’utente può spiegare il risultato a un cliente.
* Il risultato non è una black box.
* Ogni valore importante è tracciabile.

---

## FP-012 — Scenario comparison

### Obiettivo

Consentire confronto tra due o più scenari.

### Funzionalità

L’utente deve poter:

* selezionare due scenari della stessa azienda;
* selezionare scenari di aziende diverse;
* confrontare crediti;
* confrontare costi;
* confrontare segmenti;
* confrontare assumption pack;
* confrontare funding plan;
* visualizzare delta assoluto;
* visualizzare delta percentuale.

### Output

* tabella confronto;
* delta mensile;
* delta annuale;
* delta per segmento;
* delta per modello;
* scenario più economico;
* scenario più costoso;
* note differenze.

### Regole

* se gli scenari usano assumption pack diversi, mostrarlo chiaramente;
* se le aziende sono diverse, il confronto deve essere permesso ma marcato come portfolio comparison;
* i delta percentuali devono gestire divisione per zero;
* scenari archiviati possono essere confrontati ma non modificati direttamente.

### Criteri di accettazione

* L’utente può confrontare conservativo vs realistico vs aggressivo.
* Le differenze sono leggibili.
* Il sistema segnala assunzioni non omogenee.
* Il confronto è esportabile.

---

## FP-013 — Salvataggio locale

### Obiettivo

Persistenza completa senza backend.

### Funzionalità

L’app deve salvare localmente:

* aziende;
* scenari;
* segmenti;
* profili;
* task preset custom;
* assumption pack custom;
* funding plan;
* risultati calcolati;
* preferenze UI.

### Tecnologia

* localStorage per MVP;
* schema versionato;
* eventuale astrazione storage per futura migrazione.

### Regole

* ogni salvataggio deve aggiornare `updatedAt`;
* gli oggetti devono avere ID univoci;
* il sistema deve gestire dati corrotti;
* deve esistere una funzione di backup export;
* deve esistere una funzione di reset dati;
* il salvataggio automatico deve essere discreto e non invasivo.

### Criteri di accettazione

* I dati restano dopo refresh pagina.
* I dati restano dopo chiusura browser.
* L’utente può cancellare tutto consapevolmente.
* Il sistema gestisce versioni schema future.

---

## FP-014 — Export CSV

### Obiettivo

Consentire analisi e riutilizzo dei dati in Excel o strumenti esterni.

### Tipologie CSV

1. Scenario detail CSV.
2. Portfolio summary CSV.
3. Segment breakdown CSV.
4. Model breakdown CSV.

### Campi scenario detail

* company name;
* scenario name;
* assumption pack;
* segment name;
* headcount;
* enabled users;
* active users;
* usage profile;
* model;
* light tasks;
* medium tasks;
* heavy tasks;
* monthly credits min;
* monthly credits mid;
* monthly credits max;
* monthly cost min;
* monthly cost mid;
* monthly cost max;
* annual cost mid.

### Regole

* CSV deve avere header;
* separatore configurabile o standard comma;
* valori numerici non devono contenere simboli valuta nel campo numerico;
* la valuta può essere una colonna separata;
* l’export deve includere timestamp;
* i caratteri speciali devono essere gestiti correttamente.

### Criteri di accettazione

* Il CSV si apre correttamente in Excel.
* Il CSV contiene dati sufficienti per ricostruire il breakdown.
* L’export non richiede backend.
* L’utente può esportare scenario singolo o portfolio.

---

## FP-015 — Export e import JSON

### Obiettivo

Consentire backup, portabilità e scambio completo delle configurazioni.

### Export JSON

Deve includere:

* app schema version;
* exportedAt;
* companies;
* scenarios;
* profiles;
* task presets;
* assumption packs;
* funding plans;
* calculation results opzionali.

### Import JSON

L’utente deve poter:

* caricare file JSON;
* validare contenuto;
* vedere anteprima;
* scegliere merge o replace;
* risolvere conflitti;
* importare dati.

### Regole

* il JSON deve essere validato prima dell’import;
* se la versione schema è vecchia, tentare migrazione;
* se la versione schema è futura, mostrare warning;
* gli ID duplicati devono essere gestiti;
* il replace deve richiedere conferma forte;
* il merge deve preservare dati esistenti.

### Criteri di accettazione

* L’utente può esportare un backup completo.
* L’utente può importare un backup valido.
* Un file corrotto non rompe l’app.
* L’import mostra chiaramente cosa verrà aggiunto o sovrascritto.

---

## FP-016 — Condivisione tramite link

### Obiettivo

Permettere condivisione senza backend.

### Meccanismo

La configurazione condivisa può essere serializzata in JSON, compressa e inserita nel fragment URL.

Esempio concettuale:

`/#/share/<compressedPayload>`

oppure:

`/#data=<compressedPayload>`

### Funzionalità

L’utente deve poter:

* generare link scenario;
* copiare link;
* condividere verso WhatsApp;
* condividere verso Teams;
* importare scenario da link;
* visualizzare anteprima prima di salvarlo.

### Regole

* il link deve contenere solo dati necessari;
* non deve contenere dati sensibili non voluti;
* se il payload è troppo grande, suggerire export JSON;
* all’apertura di un link condiviso, l’app deve chiedere se importare lo scenario;
* la condivisione non deve richiedere server.

### Criteri di accettazione

* Un link può aprire una simulazione su un altro browser.
* L’utente può scegliere se salvare o solo visualizzare.
* Link troppo lunghi sono gestiti con fallback JSON.
* La condivisione funziona su GitHub Pages.

---

## FP-017 — Portfolio aziende

### Obiettivo

Gestire più aziende e più simulazioni in un unico ambiente locale.

### Funzionalità

L’utente deve poter:

* vedere lista aziende;
* filtrare per settore, tag, paese;
* ordinare per data, costo, nome;
* aprire dettagli azienda;
* vedere scenari collegati;
* esportare portfolio;
* confrontare aziende;
* archiviare aziende.

### Output

* tabella portfolio;
* KPI aggregati;
* costo totale mensile;
* costo totale annuale;
* numero scenari;
* top aziende per costo stimato.

### Regole

* portfolio usa solo dati locali;
* aziende archiviate sono escluse dai totali di default;
* l’utente può includere archiviate tramite filtro;
* lo stesso nome azienda può esistere ma deve generare warning.

### Criteri di accettazione

* L’utente può lavorare su più clienti.
* Il portfolio è filtrabile.
* L’export portfolio è disponibile.
* I dati archiviati non vengono persi.

---

## FP-018 — Pannello “How this was calculated”

### Obiettivo

Rendere il calcolo spiegabile.

### Contenuti

Il pannello deve mostrare:

* formula generale;
* assumption pack usato;
* versione;
* data fonte;
* credit bands;
* model factors;
* context factor;
* tools factor;
* runtime factor;
* browser/image factors;
* funding plan;
* prezzo per credito;
* warning;
* note.

### Regole

* il pannello deve essere presente in ogni scenario;
* deve essere leggibile da utente non tecnico;
* deve distinguere dati ufficiali da assunzioni custom;
* deve indicare che la stima non è un prezzo contrattuale;
* deve poter essere incluso nell’export JSON.

### Criteri di accettazione

* L’utente può spiegare come è stato ottenuto il risultato.
* Le assunzioni non sono nascoste.
* Le parti custom sono evidenziate.
* Il pannello è accessibile dal riepilogo.

---

## FP-019 — Validazioni e warning

### Obiettivo

Prevenire stime incoerenti o fuorvianti.

### Validazioni bloccanti

* nome azienda mancante;
* totale dipendenti non valido;
* percentuali fuori range;
* scenario senza assumption pack;
* scenario senza segmenti;
* valori numerici negativi;
* import JSON invalido.

### Warning non bloccanti

* segmenti inferiori al totale azienda;
* segmenti superiori al totale azienda;
* heavy usage molto elevato;
* modello con factor custom;
* assumption pack vecchio;
* funding capacity insufficiente;
* link condiviso troppo grande;
* costo mensile sopra budget;
* dati incompleti ma calcolabili.

### Criteri di accettazione

* Gli errori bloccanti impediscono il salvataggio.
* I warning spiegano il rischio senza bloccare sempre.
* L’utente sa come correggere il problema.
* I warning principali compaiono anche nel riepilogo.

---

## FP-020 — Budget guardrails

### Obiettivo

Aiutare l’utente a valutare sostenibilità economica e rischio di superamento budget.

### Funzionalità

L’utente deve poter impostare:

* budget mensile;
* budget annuale;
* soglia warning;
* soglia critical;
* crediti disponibili;
* limite per utente;
* limite per segmento.

### Output

* stato budget;
* percentuale budget consumato;
* eccedenza stimata;
* segmento che contribuisce di più;
* suggerimenti di ottimizzazione.

### Regole

* se costo stimato supera budget, mostrare alert;
* se midpoint è sotto budget ma max è sopra, mostrare warning;
* se min/mid/max sono tutti sopra budget, mostrare critical;
* il budget deve essere scenario-specific.

### Criteri di accettazione

* L’utente vede subito se lo scenario è sostenibile.
* L’app evidenzia il rischio legato al range massimo.
* I guardrail sono inclusi nel report.
* L’utente può modificare budget e vedere ricalcolo immediato.

---

## FP-021 — Report scenario

### Obiettivo

Generare una vista riepilogativa presentabile.

### Contenuti

Il report deve includere:

* nome azienda;
* nome scenario;
* data calcolo;
* assumption pack;
* totale dipendenti;
* utenti abilitati;
* utenti attivi;
* crediti mensili;
* costo mensile;
* costo annuale;
* breakdown segmenti;
* breakdown modelli;
* warning;
* note assunzioni.

### Funzionalità

* visualizzazione full page;
* copia riepilogo;
* export CSV;
* export JSON;
* stampa browser;
* condivisione link.

### Regole

* il report deve essere generato da dati correnti;
* se scenario non salvato, mostrare stato draft;
* i warning non devono essere nascosti;
* deve essere chiaro che si tratta di stima.

### Criteri di accettazione

* Il report è leggibile in meeting.
* Il report può essere condiviso.
* Il report include formule e assumption pack.
* Il report non perde informazioni critiche.

---

# 8. Requisiti non funzionali

## NF-001 — Architettura statica

L’app deve essere interamente statica.

Requisiti:

* nessun backend;
* nessun database remoto;
* nessuna autenticazione obbligatoria;
* nessun server runtime;
* compatibilità con GitHub Pages;
* routing compatibile con hosting statico.

Criterio di accettazione:

* l’app deve funzionare dopo build statica caricata su GitHub Pages.

---

## NF-002 — Privacy dei dati

Tutti i dati devono restare nel browser dell’utente.

Requisiti:

* dati salvati solo localmente;
* nessun invio a server esterni;
* nessun tracking obbligatorio;
* nessuna raccolta dati cliente;
* avviso chiaro sui dati salvati localmente.

Criterio di accettazione:

* creando uno scenario non viene effettuata nessuna chiamata remota per salvarlo.

---

## NF-003 — Sicurezza client-side

Anche se non c’è backend, l’app deve proteggere l’utente da dati corrotti o input malevoli.

Requisiti:

* validazione import JSON;
* sanitizzazione testo visualizzato;
* nessuna esecuzione di codice importato;
* gestione payload URL non valido;
* protezione da crash su localStorage corrotto.

Criterio di accettazione:

* un JSON non valido non deve bloccare o rompere l’app.

---

## NF-004 — Performance

L’app deve essere fluida anche con un portfolio medio-grande.

Target:

* fino a 500 aziende;
* fino a 5.000 scenari;
* fino a 50 segmenti per scenario;
* ricalcolo sotto i 200 ms nei casi comuni;
* caricamento iniziale sotto i 3 secondi su rete standard.

Criterio di accettazione:

* il calcolo deve aggiornarsi in tempo reale senza rallentamenti percepibili su scenari standard.

---

## NF-005 — Usabilità

L’app deve essere comprensibile da utenti non tecnici.

Requisiti:

* linguaggio chiaro;
* tooltip sulle assunzioni;
* wizard guidato;
* empty state utili;
* warning spiegati;
* numeri formattati correttamente;
* CTA evidenti.

Criterio di accettazione:

* un utente business deve poter creare una stima base senza leggere documentazione esterna.

---

## NF-006 — Accessibilità

L’interfaccia deve rispettare buone pratiche accessibili.

Requisiti:

* contrasto adeguato;
* navigazione da tastiera;
* label sui campi;
* messaggi errore leggibili;
* componenti shadcn/ui accessibili;
* no informazione trasmessa solo tramite colore.

Criterio di accettazione:

* i form principali devono essere utilizzabili anche senza mouse.

---

## NF-007 — Manutenibilità

Il codice deve essere facilmente aggiornabile.

Requisiti:

* TypeScript strict;
* componenti modulari;
* funzioni di calcolo isolate;
* assumption pack separati dal codice UI;
* test unitari sul motore di calcolo;
* naming coerente;
* struttura cartelle pulita.

Criterio di accettazione:

* aggiornare le bande di credito non deve richiedere modifiche sparse in più componenti.

---

## NF-008 — Auditabilità

Ogni scenario deve essere ricostruibile.

Requisiti:

* memorizzare versione assumption pack;
* memorizzare data calcolo;
* memorizzare input principali;
* memorizzare funding plan;
* distinguere default e custom;
* includere note fonte.

Criterio di accettazione:

* aprendo uno scenario salvato si capisce con quali assunzioni era stato calcolato.

---

## NF-009 — Resilienza dati

L’app deve gestire errori di storage.

Requisiti:

* fallback se localStorage non disponibile;
* gestione quota storage superata;
* export backup suggerito;
* recovery da dati parziali;
* reset controllato.

Criterio di accettazione:

* se localStorage è pieno, l’app avvisa l’utente e non perde la sessione corrente.

---

## NF-010 — Compatibilità browser

L’app deve funzionare sui browser moderni.

Target:

* Chrome;
* Edge;
* Firefox;
* Safari.

Criterio di accettazione:

* le funzionalità core funzionano sui browser moderni desktop.

---

## NF-011 — Portabilità

L’app deve poter essere clonata, buildata e deployata facilmente.

Requisiti:

* progetto React standard;
* build con Vite;
* deploy su GitHub Pages;
* configurazione base path;
* README operativo;
* nessuna variabile server obbligatoria.

Criterio di accettazione:

* un developer può eseguire install, build e deploy seguendo il README.

---

## NF-012 — Chiarezza commerciale

L’app deve evitare interpretazioni errate.

Requisiti:

* disclaimer visibile;
* distinzione tra dati ufficiali e stime;
* warning su pricing non deterministico;
* formule visibili;
* assumption pack versionati.

Criterio di accettazione:

* nessun risultato deve essere presentato come prezzo ufficiale o vincolante.

---

# 9. Regole di business principali

## BR-001 — Ogni scenario deve avere un assumption pack

Senza assumption pack non è possibile calcolare uno scenario.

## BR-002 — Ogni scenario deve appartenere a una company

Non sono ammessi scenari orfani.

## BR-003 — Le assunzioni custom devono essere evidenziate

Se un utente modifica factor, credit bands o pricing, il risultato deve indicare che usa valori custom.

## BR-004 — Il calcolo deve produrre range

Il sistema deve preferire min/mid/max rispetto a un solo valore, salvo modalità point estimate esplicitamente scelta.

## BR-005 — I dati ufficiali non devono essere sovrascritti

I preset di sistema possono essere duplicati, ma non modificati direttamente.

## BR-006 — Le configurazioni devono essere esportabili

Qualsiasi dato salvato deve poter essere incluso in un export JSON.

## BR-007 — Il link sharing non deve dipendere da server

La condivisione deve funzionare tramite payload locale nel link o export file.

## BR-008 — Il breakdown deve quadrare

La somma dei breakdown deve corrispondere al totale dello scenario, salvo arrotondamenti dichiarati.

## BR-009 — Il funding plan non modifica i crediti

Il funding plan cambia il costo economico, non il consumo tecnico stimato.

## BR-010 — Gli scenari archiviati non sono modificabili direttamente

Per modificare uno scenario archiviato, l’utente deve prima ripristinarlo o duplicarlo.

---

# 10. Flussi utente principali

## 10.1 Creazione rapida scenario

1. L’utente apre l’app.
2. Clicca “New scenario”.
3. Inserisce nome azienda e numero dipendenti.
4. Sceglie template aziendale.
5. Conferma segmenti proposti.
6. Seleziona usage profile.
7. Seleziona assumption pack.
8. Visualizza stima.
9. Salva scenario.
10. Esporta o condivide.

---

## 10.2 Creazione avanzata scenario

1. L’utente crea o seleziona azienda.
2. Inserisce segmenti personalizzati.
3. Configura percentuali di abilitazione.
4. Configura percentuali di utilizzo attivo.
5. Definisce mix light/medium/heavy.
6. Seleziona modelli per segmento.
7. Modifica fattori contesto/tool/runtime.
8. Imposta funding plan.
9. Analizza breakdown.
10. Salva scenario.
11. Confronta con altro scenario.

---

## 10.3 Import scenario da link

1. L’utente apre link condiviso.
2. L’app rileva payload nel fragment URL.
3. Decodifica e valida payload.
4. Mostra anteprima.
5. L’utente sceglie:

   * visualizza senza salvare;
   * importa come nuovo scenario;
   * merge in azienda esistente.
6. L’app salva localmente se richiesto.

---

## 10.4 Export portfolio

1. L’utente apre dashboard portfolio.
2. Applica eventuali filtri.
3. Clicca export.
4. Sceglie CSV o JSON.
5. Scarica file.
6. L’app registra timestamp export.

---

# 11. Schermate principali

## 11.1 Dashboard

Contiene:

* KPI principali;
* aziende recenti;
* scenari recenti;
* alert assumption pack;
* azioni rapide.

## 11.2 Companies

Contiene:

* lista aziende;
* filtri;
* ricerca;
* ordinamento;
* creazione nuova azienda.

## 11.3 Company detail

Contiene:

* dati azienda;
* segmenti;
* scenari collegati;
* costo aggregato;
* azioni.

## 11.4 Scenario builder

Contiene:

* wizard;
* form segmenti;
* profili;
* modelli;
* funding;
* preview calcolo.

## 11.5 Calculator

Contiene:

* input avanzati;
* calcolo live;
* breakdown;
* range min/mid/max;
* warning.

## 11.6 Scenario report

Contiene:

* riepilogo scenario;
* KPI;
* breakdown;
* formula;
* assumption pack;
* export/share.

## 11.7 Scenario comparison

Contiene:

* selezione scenari;
* tabella confronto;
* delta;
* warning su assunzioni diverse.

## 11.8 Assumptions

Contiene:

* assumption pack;
* modelli;
* credit bands;
* factor;
* duplicazione;
* modifica custom.

## 11.9 Settings

Contiene:

* valuta;
* preferenze display;
* gestione storage;
* export completo;
* import;
* reset dati.

---

# 12. MVP consigliato

## Release 1 — MVP completo

Include:

* dashboard;
* gestione aziende;
* gestione segmenti;
* scenario builder;
* profili light/medium/heavy;
* task preset base;
* assumption pack ufficiale range-based;
* PAYG funding;
* calcolo min/mid/max;
* breakdown per segmento;
* localStorage;
* export CSV;
* export JSON;
* import JSON;
* share link;
* report scenario.

## Release 2 — Advanced estimator

Include:

* portfolio avanzato;
* prepaid tier;
* existing capacity;
* blended funding;
* scenario comparison;
* model sensitivity;
* task mix avanzato;
* assumption pack custom avanzati.

## Release 3 — Consultant workbench

Include:

* report stampabile;
* export PDF;
* template settore;
* phased rollout;
* multi-currency;
* grafici avanzati;
* simulazione budget;
* benchmark scenario.

---

# 13. Priorità funzionali

## Must have

* creazione azienda;
* creazione segmenti;
* creazione scenario;
* usage profile;
* assumption pack;
* motore calcolo;
* min/mid/max;
* costo mensile/annuale;
* localStorage;
* export JSON;
* export CSV;
* disclaimer assunzioni.

## Should have

* scenario comparison;
* share link;
* funding prepaid;
* existing capacity;
* task preset custom;
* model factor custom;
* portfolio dashboard.

## Could have

* export PDF;
* grafici avanzati;
* template per industry;
* multi-currency;
* import Excel;
* dark mode.

## Won’t have nella prima release

* backend;
* login;
* sync cloud;
* API Microsoft;
* billing reale;
* dati reali tenant.

---

# 14. Criteri generali di accettazione

L’app può essere considerata funzionalmente accettabile quando:

1. un utente può creare un’azienda;
2. un utente può modellare almeno tre segmenti;
3. un utente può assegnare profili light/medium/heavy;
4. un utente può selezionare un assumption pack;
5. il sistema calcola crediti mensili e annuali;
6. il sistema calcola costo mensile e annuale;
7. il sistema mostra range min/mid/max;
8. il sistema mostra breakdown per segmento;
9. il sistema salva tutto localmente;
10. il sistema permette export JSON;
11. il sistema permette import JSON;
12. il sistema permette export CSV;
13. il sistema mostra le assunzioni usate;
14. il sistema non presenta il risultato come prezzo ufficiale;
15. il sistema funziona come static app su GitHub Pages.

---

# 15. Indicazioni per sviluppo

L’implementazione dovrà essere modulare.

## Stack suggerito

* React;
* TypeScript;
* Vite;
* Tailwind CSS;
* shadcn/ui;
* localStorage;
* React Router;
* Zod per validazione schema;
* Recharts o libreria simile per grafici;
* PapaParse o utility custom per CSV;
* LZ-string o compressione equivalente per share link.

## Moduli principali

* `companies`
* `segments`
* `scenarios`
* `profiles`
* `tasks`
* `models`
* `assumptions`
* `funding`
* `calculator`
* `storage`
* `export`
* `import`
* `sharing`
* `validation`
* `ui`

## Servizi logici

* `calculationEngine`
* `storageService`
* `exportService`
* `importService`
* `sharingService`
* `assumptionService`
* `validationService`

## Test minimi

* calcolo utenti abilitati;
* calcolo utenti attivi;
* calcolo crediti per segmento;
* calcolo totale scenario;
* calcolo funding PAYG;
* calcolo existing capacity;
* export/import JSON;
* validazione JSON corrotto;
* scenario con zero utenti;
* scenario con segmenti oltre totale azienda.

---

# 16. Nota funzionale finale

Il principio più importante dell’app è la **trasparenza**.

Dato che il modello di pricing Cowork non è pubblicato come formula deterministica completa per ogni modello, l’app deve sempre comunicare che:

* il risultato è una stima;
* il risultato dipende da assunzioni;
* le assunzioni sono modificabili;
* le fonti e la versione dell’assumption pack sono visibili;
* i valori min/mid/max sono più corretti di un singolo numero;
* il calcolo serve per pianificazione, confronto e discussione, non per fatturazione ufficiale.

L’app deve quindi essere progettata come un **cost planning workbench**, non come un semplice calcolatore numerico.
