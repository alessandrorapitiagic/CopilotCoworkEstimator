Starting from "bad writing" and explaining what I want (use this to do a deep research)

```text
Dobbiamo fare una deep research sui nuovi customer cowork credits di copilot di microsoft, è uscito in anteprima da pochissimo e sappiamo che da luglio costerà ogni richiesta ma non si capisce bene come, servirebbe di capire come viene consumato un credito, a cosa equivale e creare poi un'app che faccia da estimator sensatamente, un'app estimator già l'ha fatta microsoft ma è minimale, la trovi qui https://bosh345.github.io/customer-cowork-estimator-app/ ma non funziona bene e calcola sono con anthropic, quando invece ora ci sono anche gli altri modelli disponibili, dobbiamo andare a vedere il prezziaro interente a cowork in base al modello e poi dovremmo creare delle stime, dovremmo capire per tipologie di ricerche e fare una specie di cost calculator di azure, dove inserisci che tipologie di chiamate vengono fatte e in base a quello capire il calcolo, farei sia degli oggetti già pronti, spiegando light, medium e heavy e poi uno può crearsi il suo custom oggetto che rimane salvato in local storage, faremo un'app react con grafica shadcn/ui e la metteremo su github pages, mi serve però di fare la ricerca approfondita per trovare le info giuste per tutto quanto. Io farei che deve anche calcolare da solo, in base all'azienda a quello che fa, se è un'azienda che ha un grande uso o meno, e deve esserci ad esempio l'azienda è composta da 500 persone, e io ho 20 dirigenti, 40 white collar e tutto il resto blue collar, quindi devo dare un'idea in base a queste numeriche di utilizzo che può essere poi stravolta, se ho 40 white collar significa che ttutti potenzialmente possono avere un consumo heavy della cosa, e così via. Devo strutturare qualcosa che aiuti a calcolare per tutti quanti, inotlre è possibile aggiungere anche delle categorie oltre a white collar, blue collar e manager/dirigenti, perché posso così strutturare qualsiasi azienda, è bene poi che mi salvi in local storage e che sia esportabile il dato, inoltre serve che sia esportabile in csv di modo che posso farlo per tutti e posso anche salvarmi in local storage la configurazione, posso anche condividerla su whatsapp o su teams o come link a chi voglio e quindi deve tirar fuori anche un json o qualcosa di simile salvato da qualche parte, deve rimanere sempre una static app senza server ovviamente perché deve stare su github pages, inoltre possiamo salvarci le configurazioni e salvsarci la lista di calcoli che abbiamo fatto, come ad esempio una lista di aziende, e di calcoli che abbiamo fatto e poi possiamo modifircarli e rientrare. Preparami una ricerca approfondita sul costo, preparami un'analisi funzionale per l'app che andiamo a costruire da sottomettere a github copilot
```

Now improve the prompt with AI, request to improve the text above.
We obtain:

```markdown
# Prompt per deep research e analisi funzionale

## Customer Cowork Credits di Microsoft Copilot

Dobbiamo svolgere una **ricerca approfondita sui nuovi Customer Cowork Credits di Microsoft Copilot**.

Il servizio è uscito in anteprima da poco e, da luglio, ogni richiesta dovrebbe avere un costo. Al momento però non è chiaro:

* come viene consumato un credito;
* a cosa equivale un credito;
* quanto costa una richiesta;
* come varia il costo in base al modello utilizzato;
* quali modelli sono supportati;
* come stimare correttamente il consumo per aziende di dimensioni e strutture diverse.

L’obiettivo finale è creare una **web app statica in React**, ospitata su **GitHub Pages**, che funzioni come **estimator / cost calculator** per i Customer Cowork Credits.

Microsoft ha già realizzato un estimator minimale, disponibile qui:

https://bosh345.github.io/customer-cowork-estimator-app/

Tuttavia, questa app sembra limitata e non pienamente aggiornata: al momento pare calcolare solo su Anthropic, mentre ora sembrano disponibili anche altri modelli. Serve quindi una ricerca più accurata sul pricing e sul consumo dei crediti.

---

# Obiettivi della ricerca

La ricerca deve chiarire in modo dettagliato:

1. **Cosa sono i Customer Cowork Credits**

   * Definizione ufficiale.
   * Scopo del servizio.
   * Relazione con Microsoft Copilot, Copilot Studio, agenti, modelli e ambienti enterprise.

2. **Come vengono consumati i crediti**

   * Quando viene scalato un credito.
   * Se il consumo dipende da:

     * numero di richieste;
     * input token;
     * output token;
     * durata dell’elaborazione;
     * modello utilizzato;
     * tipo di azione richiesta;
     * chiamate a strumenti esterni;
     * agenti o workflow multi-step.

3. **A cosa equivale un credito**

   * Equivalenza tecnica o commerciale.
   * Eventuali conversioni credito/token/richiesta.
   * Differenze tra modelli.
   * Differenze tra task semplici e task complessi.

4. **Pricing aggiornato**

   * Prezzi ufficiali Microsoft.
   * Prezzi in anteprima.
   * Prezzi previsti da luglio.
   * Eventuali differenze tra regioni, piani o tenant.
   * Eventuali limiti gratuiti, bundle, soglie o pacchetti inclusi.

5. **Modelli disponibili**

   * Elenco aggiornato dei modelli supportati.
   * Anthropic.
   * OpenAI.
   * Altri modelli disponibili.
   * Differenze di costo per modello.
   * Differenze di performance o use case consigliati.

6. **Confronto con estimator Microsoft esistente**

   * Analizzare l’estimator disponibile qui:
     https://bosh345.github.io/customer-cowork-estimator-app/
   * Capire quali assunzioni utilizza.
   * Identificare limiti, errori e funzionalità mancanti.
   * Valutare cosa migliorare nella nostra app.

---

# Obiettivo dell’app da costruire

Dobbiamo progettare una **static web app** simile a un **Azure Pricing Calculator**, ma dedicata ai Customer Cowork Credits.

L’app deve permettere all’utente di stimare il consumo e il costo in base a:

* tipo di azienda;
* numero totale di dipendenti;
* categorie di utenti;
* profili di utilizzo;
* modelli AI utilizzati;
* tipologie di richieste;
* intensità di consumo;
* scenari predefiniti e scenari personalizzati.

L’app deve essere realizzata in:

* **React**
* **TypeScript**
* **shadcn/ui**
* **Tailwind CSS**
* storage locale tramite **localStorage**
* deploy statico su **GitHub Pages**
* nessun backend/server

---

# Struttura funzionale richiesta

## 1. Configurazione azienda

L’utente deve poter creare una o più configurazioni aziendali.

Ogni configurazione deve includere:

* nome azienda;
* numero totale di dipendenti;
* settore o tipologia di azienda;
* descrizione opzionale;
* categorie di personale.

Esempio:

* Azienda da 500 persone
* 20 dirigenti / manager
* 40 white collar
* 440 blue collar

L’app deve permettere di aggiungere anche categorie personalizzate oltre a quelle standard.

Categorie standard iniziali:

* Manager / Dirigenti
* White collar
* Blue collar

Categorie personalizzabili, ad esempio:

* Sales
* Customer care
* HR
* Finance
* Legal
* Operations
* IT
* Marketing
* R&D
* Field workers
* External consultants

---

## 2. Profili di utilizzo

Per ogni categoria di utenti, l’app deve permettere di assegnare un profilo di utilizzo.

Profili predefiniti:

### Light usage

Uso occasionale, poche richieste al giorno, task semplici.

Esempi:

* brevi riassunti;
* piccole ricerche;
* generazione testi brevi;
* classificazioni semplici.

### Medium usage

Uso regolare, più richieste al giorno, task intermedi.

Esempi:

* analisi documenti;
* supporto operativo;
* generazione report;
* workflow con più step;
* ricerche mediamente articolate.

### Heavy usage

Uso intensivo, molte richieste al giorno, task complessi.

Esempi:

* analisi approfondite;
* agenti autonomi;
* workflow multi-step;
* confronto documentale;
* generazione contenuti estesi;
* attività di ricerca avanzata.

L’utente deve poter modificare i parametri di ogni profilo e creare profili custom.

---

## 3. Oggetti di consumo predefiniti

L’app deve includere oggetti di stima già pronti per diverse tipologie di chiamate.

Esempi:

* Simple prompt
* Document summarization
* Deep research
* Agent task
* Multi-step workflow
* Customer support automation
* Sales research
* Legal document review
* HR policy analysis
* Data extraction
* Report generation

Ogni oggetto deve contenere parametri stimabili come:

* modello utilizzato;
* numero medio di richieste;
* complessità;
* token input stimati;
* token output stimati;
* eventuali step intermedi;
* consumo crediti stimato;
* costo stimato.

L’utente deve poter creare oggetti custom e salvarli.

---

## 4. Calcolo automatico per tipologia di azienda

L’app deve aiutare l’utente a stimare il consumo in modo guidato.

Deve essere possibile inserire dati aziendali come:

* numero totale dipendenti;
* distribuzione per categoria;
* percentuale di utenti attivi;
* livello medio di utilizzo;
* frequenza giornaliera;
* giorni lavorativi mensili;
* modello AI prevalente;
* scenari alternativi.

L’app deve proporre una stima automatica iniziale basata sulla struttura aziendale.

Esempio:

Se un’azienda ha 500 persone, di cui:

* 20 manager;
* 40 white collar;
* 440 blue collar;

l’app potrebbe stimare che:

* i manager abbiano un consumo medium/heavy;
* i white collar possano avere un consumo medium/heavy;
* i blue collar abbiano un consumo light o nullo, salvo casi specifici.

Questa stima deve essere modificabile dall’utente.

---

## 5. Calcolatore custom

L’utente deve poter costruire manualmente il proprio scenario.

Deve poter configurare:

* categorie utenti;
* numero utenti per categoria;
* profilo di utilizzo;
* modello AI;
* oggetti di consumo;
* richieste giornaliere;
* giorni al mese;
* consumo medio per richiesta;
* costo per credito;
* costo totale mensile;
* costo totale annuale.

Il risultato deve mostrare:

* consumo totale crediti/mese;
* costo totale/mese;
* costo totale/anno;
* costo per categoria;
* costo per utente;
* costo per modello;
* breakdown dettagliato.

---

## 6. Salvataggio locale

L’app deve essere completamente statica e senza backend.

Tutti i dati devono essere salvati in **localStorage**.

Devono essere salvabili:

* configurazioni aziendali;
* scenari di calcolo;
* profili di utilizzo custom;
* oggetti di consumo custom;
* storico dei calcoli;
* lista aziende analizzate.

L’utente deve poter:

* creare un nuovo calcolo;
* salvare un calcolo;
* duplicare un calcolo;
* modificare un calcolo esistente;
* eliminare un calcolo;
* rientrare in un calcolo salvato;
* confrontare più calcoli.

---

## 7. Esportazione e condivisione

L’app deve permettere di esportare i dati in:

* CSV;
* JSON;
* eventuale file di backup/import.

Deve essere possibile condividere una configurazione tramite:

* link;
* WhatsApp;
* Microsoft Teams;
* copia negli appunti.

Poiché l’app deve restare statica e senza server, la condivisione può avvenire tramite:

* JSON serializzato;
* configurazione compressa nel fragment URL;
* import/export manuale;
* copia di un link contenente lo scenario;
* download/upload di file JSON.

La soluzione deve evitare qualsiasi dipendenza da un backend.

---

## 8. UI e UX

L’interfaccia deve essere moderna, chiara e professionale.

Usare:

* React;
* TypeScript;
* shadcn/ui;
* Tailwind CSS;
* componenti riutilizzabili;
* layout responsive.

La UX dovrebbe essere simile a un pricing calculator.

Sezioni suggerite:

1. Dashboard
2. Aziende salvate
3. Nuovo scenario
4. Configurazione azienda
5. Profili di utilizzo
6. Modelli e pricing
7. Calcolatore
8. Breakdown costi
9. Esportazione
10. Impostazioni

Componenti utili:

* card riepilogative;
* tabelle modificabili;
* slider;
* select;
* input numerici;
* badge;
* grafici;
* breakdown per categoria;
* comparazione scenari;
* alert sulle assunzioni;
* pannello “fonti e note”.

---

# Deliverable richiesti

La risposta finale deve includere:

## 1. Ricerca approfondita

Preparare una ricerca approfondita sui Customer Cowork Credits, includendo:

* fonti ufficiali Microsoft;
* documentazione tecnica;
* pricing aggiornato;
* modelli supportati;
* metodo di calcolo;
* limiti noti;
* assunzioni ragionevoli dove Microsoft non fornisce dati chiari;
* confronto con estimator Microsoft esistente.

## 2. Modello di calcolo

Definire un modello di calcolo utilizzabile nell’app.

Il modello deve spiegare:

* input necessari;
* formule;
* variabili;
* profili light/medium/heavy;
* categorie utente;
* scenari custom;
* costo mensile;
* costo annuale;
* breakdown per categoria e modello.

## 3. Analisi funzionale dell’app

Preparare un’analisi funzionale completa da usare come base per lo sviluppo.

Deve includere:

* requisiti funzionali;
* requisiti non funzionali;
* struttura dati;
* schermate principali;
* flussi utente;
* logica di calcolo;
* localStorage;
* export/import;
* condivisione via link;
* edge case;
* validazioni;
* suggerimenti UX.

## 4. Specifica tecnica per GitHub Copilot

Preparare una specifica chiara da passare a GitHub Copilot per costruire l’app.

La specifica deve includere:

* stack tecnologico;
* struttura progetto;
* componenti React;
* tipi TypeScript;
* funzioni di calcolo;
* persistenza localStorage;
* export CSV/JSON;
* import JSON;
* routing;
* deploy GitHub Pages;
* istruzioni operative per generare il codice.

---

# Vincoli importanti

* L’app deve essere completamente statica.
* Non deve usare backend.
* Deve funzionare su GitHub Pages.
* Tutti i dati devono restare nel browser.
* La configurazione deve essere salvabile e modificabile.
* Deve essere possibile gestire più aziende e più scenari.
* Deve essere possibile esportare e condividere i dati.
* Le assunzioni di costo devono essere sempre visibili all’utente.
* Dove Microsoft non fornisce dati certi, l’app deve indicare chiaramente che si tratta di stime.
* Il pricing deve essere facilmente aggiornabile nel codice.
* L’app deve essere pensata per uso consulenziale e comparazione tra clienti diversi.

---

# Output atteso

Produci un documento strutturato e pronto all’uso contenente:

1. Executive summary.
2. Ricerca sui Customer Cowork Credits.
3. Tabella dei modelli disponibili e relativo pricing.
4. Spiegazione del consumo crediti.
5. Ipotesi di calcolo.
6. Profili light/medium/heavy.
7. Modello matematico di stima.
8. Analisi funzionale dell’app.
9. Specifica tecnica React/TypeScript.
10. Struttura dati suggerita.
11. Roadmap di sviluppo.
12. Prompt operativo finale da passare a GitHub Copilot.

Lo stile deve essere tecnico, chiaro, ordinato e adatto a un team di sviluppo.
```

Go for deep research now with researche on copilot m365 or chatgpt or something else.
