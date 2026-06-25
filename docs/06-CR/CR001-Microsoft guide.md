## CR-001 — Adeguamento del motore di calcolo alla Microsoft Copilot Credits Guide June 2026

---

### 1. Obiettivo funzionale

La funzionalità “Adeguamento del motore di calcolo alla Microsoft Copilot Credits Guide June 2026” introduce una modifica trasversale all’app per allineare il modello di stima Cowork al documento Microsoft Copilot Credits Guide — June 2026.

Questa CR non introduce una nuova schermata isolata, ma modifica e rafforza più funzionalità esistenti, in particolare:

* FP-006 — Gestione task preset;
* FP-008 — Assumption pack versionati;
* FP-009 — Funding plan e valorizzazione economica;
* FP-010 — Motore di calcolo;
* FP-011 — Breakdown risultati;
* FP-012 — Scenario comparison;
* FP-014 — Export CSV;
* FP-015 — Export e import JSON;
* FP-018 — Pannello “How this was calculated”;
* FP-019 — Validazioni e warning;
* FP-020 — Budget guardrails;
* FP-021 — Report scenario.

L’obiettivo principale è distinguere chiaramente tra:

1. **Official Guide Mode**

   * modalità default dell’app;
   * basata direttamente sulla metodologia descritta dalla guida Microsoft;
   * usa utenti Cowork, prompt per persona e intensità Light/Medium/Heavy;
   * usa range ufficiali illustrativi per task Cowork.

2. **Advanced Driver-Adjusted Mode**

   * modalità avanzata;
   * usa factor Models, Context, Tools e Runtime;
   * utile per pianificazione interna;
   * deve essere marcata come custom planning mode, non come rate card ufficiale.

3. **Custom Planning Mode**

   * modalità completamente personalizzabile;
   * consente override di range, factor, funding e assumption;
   * richiede warning e tracciabilità.

La modifica serve a rendere il motore più fedele alla guida Microsoft, evitando che factor custom o formule avanzate vengano percepite come formula ufficiale di billing.

---

### 2. Ambito della modifica

La CR-001 modifica:

* il modello dati delle assumption;
* la formula principale del motore;
* la gestione dei task Heavy open-ended;
* la gestione del Pre-Purchase Plan P3;
* i warning metodologici;
* i report;
* gli export;
* la comparison;
* il pannello di explainability;
* la gestione degli scope di workload.

La CR-001 non modifica l’obiettivo dell’app, che resta:

```text id="8gepxb"
stimare Microsoft Copilot Cowork Credits a fini di pianificazione
```

Non introduce invece, nel perimetro MVP, un motore completo per:

* Work IQ APIs;
* Copilot Studio;
* Dynamics 365 agents;
* Power Platform workloads;
* Business Applications;
* Microsoft 365 Copilot native experiences.

Questi workload devono essere riconosciuti come esclusi o futuri moduli separati.

---

### 3. Razionale della modifica

La guida Microsoft chiarisce che, per pianificare Cowork, il modello più semplice e trasparente è:

1. determinare il numero di utenti Cowork, raggruppati per persona;
2. stimare il numero di prompt per persona, distinti tra Light, Medium e Heavy;
3. applicare un costo/credito medio per prompt;
4. ottenere la stima mensile di Copilot Credits per Cowork.

La guida mostra inoltre che il consumo Cowork varia in base a quattro bucket:

* Models;
* Runtime;
* Context;
* Tools.

Questo significa che il nostro motore deve supportare due livelli:

* una modalità ufficiale di pianificazione semplice e allineata alla guida;
* una modalità avanzata che usa i driver, ma solo come estensione personalizzata.

Il rischio da evitare è presentare una formula custom con model factor, browser factor o image factor come se fosse la formula ufficiale Microsoft.

---

### 4. FP impattate

| FP                                  | Impatto                                                       | Tipo modifica               |
| ----------------------------------- | ------------------------------------------------------------- | --------------------------- |
| FP-006 — Gestione task preset       | Aggiornare intensità e task Heavy open-ended                  | Modifica dati e validazioni |
| FP-008 — Assumption pack versionati | Aggiungere pack “Microsoft Copilot Credits Guide — June 2026” | Modifica assumption         |
| FP-009 — Funding plan               | Correggere P3 come pool annuale upfront                       | Modifica calcolo funding    |
| FP-010 — Motore di calcolo          | Aggiungere calculation modes                                  | Modifica core               |
| FP-011 — Breakdown risultati        | Mostrare modalità di calcolo e Heavy open-ended               | Modifica UI/result          |
| FP-012 — Scenario comparison        | Evidenziare scenari con calculation mode diversa              | Modifica comparison         |
| FP-014 — Export CSV                 | Esportare calculation mode e source guide                     | Modifica export             |
| FP-015 — Export/import JSON         | Includere nuovi campi mode/source/open-ended                  | Modifica schema             |
| FP-018 — How this was calculated    | Mostrare Official Guide vs Advanced mode                      | Modifica explainability     |
| FP-019 — Validazioni e warning      | Aggiungere warning metodologici                               | Modifica validation         |
| FP-020 — Budget guardrails          | Budget su P3 annual pool e spillover                          | Modifica budget             |
| FP-021 — Report scenario            | Rafforzare source, disclaimer e mode                          | Modifica report             |

---

### 5. Nuovi concetti funzionali

## 5.1 Calculation mode

Ogni scenario deve avere un campo:

```text id="djgi4v"
calculationMode:
  | "officialGuide"
  | "advancedDriverAdjusted"
  | "customPlanning"
```

Significato:

| Mode                     | Descrizione                                                                 | Default | Warning |
| ------------------------ | --------------------------------------------------------------------------- | ------: | ------- |
| `officialGuide`          | Usa metodologia guida Microsoft: utenti × prompt × range Light/Medium/Heavy |      sì | no      |
| `advancedDriverAdjusted` | Applica factor Models/Context/Tools/Runtime                                 |      no | sì      |
| `customPlanning`         | Usa assumption completamente custom                                         |      no | sì      |

---

## 5.2 Workload type

Ogni scenario deve avere un campo:

```text id="nhsslq"
workloadType:
  | "cowork"
  | "workIqApi"
  | "copilotStudio"
  | "businessApplications"
  | "other"
```

Per MVP:

```text id="69b86k"
workloadType = "cowork"
```

Gli altri workload devono essere marcati come:

```text id="q5b477"
notSupportedInCurrentCalculator
```

---

## 5.3 Official guide assumption pack

Deve essere introdotto un assumption pack di sistema:

```text id="8ytrmy"
Microsoft Copilot Credits Guide — June 2026
```

Contenuto minimo:

```text id="cgzaaj"
Light:
  min = 70
  mid = configurable default
  max = 200

Medium:
  min = 400
  mid = configurable default
  max = 600

Heavy:
  min = 1500
  mid = configurable planning value
  max = null
  isOpenEnded = true
```

Il midpoint non è esplicitamente indicato dalla guida per ogni range, quindi deve essere calcolato o configurato come valore di pianificazione.

Valori midpoint consigliati:

```text id="gz7hoc"
Light mid = 135
Medium mid = 500
Heavy mid = 1500 or user-defined planning value
```

Per Heavy è preferibile richiedere un valore planning cap o planning midpoint esplicito quando lo scenario usa task Heavy.

---

## 5.4 Heavy open-ended

Il task Heavy non deve essere trattato come un range chiuso.

Deve supportare:

```text id="zl3ifu"
CreditBand {
  intensity: "heavy"
  min: 1500
  mid: number
  max?: number | null
  isOpenEnded: true
  planningCap?: number | null
}
```

Il sistema deve mostrare:

```text id="ep4sp5"
Heavy tasks are modeled as 1,500+ Copilot Credits. The maximum value depends on the planning cap selected for this estimate.
```

---

## 5.5 P3 annual pool

Il Pre-Purchase Plan P3 deve essere trattato come pool annuale upfront, non come semplice rate mensile.

Nuovi campi:

```text id="7g5qqu"
P3FundingPlan {
  annualPrepaidCredits: number
  annualPrepaidCost?: number
  discountPercentage: number
  effectivePricePerCredit: number
  termMonths: 12
  unusedCreditsExpire: true
  spilloverMode: "payg" | "additionalPurchase" | "blocked"
}
```

---

### 6. Modifica FP-010 — Motore di calcolo

## 6.1 Nuova regola core

Il motore deve selezionare la formula in base a `calculationMode`.

```text id="8ptkec"
if calculationMode == "officialGuide":
  useOfficialGuideFormula()

if calculationMode == "advancedDriverAdjusted":
  useAdvancedDriverAdjustedFormula()

if calculationMode == "customPlanning":
  useCustomPlanningFormula()
```

---

## 6.2 Formula Official Guide Mode

La formula default diventa:

```text id="p63867"
monthlyCoworkCredits =
  sum over segments/personas of:
    coworkUsers
    × monthlyPromptsPerUserByIntensity
    × creditsPerPromptByIntensity
```

Espansa per intensità:

```text id="d5gc72"
segmentMonthlyCredits =
  activeCoworkUsers
  × (
      lightPromptsPerUser × lightCreditsPerPrompt
    + mediumPromptsPerUser × mediumCreditsPerPrompt
    + heavyPromptsPerUser × heavyCreditsPerPrompt
  )
```

Dove:

```text id="gkir6l"
activeCoworkUsers =
  enabledCoworkUsers × activeUsagePercentage / 100
```

e:

```text id="wm5idr"
enabledCoworkUsers =
  headcount × enabledPercentage / 100
```

---

## 6.3 Range calculation

Il motore deve calcolare min/mid/max.

```text id="ppqoa6"
monthlyCreditsMin =
  sum(activeUsers × prompts × creditsMin)

monthlyCreditsMid =
  sum(activeUsers × prompts × creditsMid)

monthlyCreditsMax =
  sum(activeUsers × prompts × creditsMax)
```

Per Heavy open-ended:

```text id="yfuy13"
if heavy.max == null:
  monthlyCreditsMax = null
  maxIsOpenEnded = true
```

Oppure, se l’utente configura planning cap:

```text id="t9hka0"
heavy.max = planningCap
```

---

## 6.4 Formula Advanced Driver-Adjusted Mode

La formula avanzata resta supportata:

```text id="daw1gm"
estimatedCreditsPerTask =
  baseIntensityCredits
  × modelFactor
  × contextFactor
  × toolsFactor
  × runtimeFactor
```

Non devono essere applicati di default:

* browserFactor;
* imageFactor.

Questi possono restare solo come custom extensions se presenti nel prodotto.

Formula estesa opzionale:

```text id="lw6a8j"
estimatedCreditsPerTask =
  baseIntensityCredits
  × modelFactor
  × contextFactor
  × toolsFactor
  × runtimeFactor
  × optionalCustomFactors
```

Dove:

```text id="f2oz37"
optionalCustomFactors =
  browserFactor × imageFactor × otherCustomFactors
```

---

## 6.5 Regola di trasparenza

Se lo scenario usa `advancedDriverAdjusted` o `customPlanning`, il calculation result deve includere:

```text id="29uu7n"
usesCustomPlanningLogic = true
```

e generare warning:

```text id="x0tg2t"
This scenario uses custom planning factors beyond the official guide methodology.
```

---

## 6.6 Output CalculationResult aggiornato

Aggiungere:

```text id="1w6f9g"
CalculationResult {
  calculationMode: "officialGuide" | "advancedDriverAdjusted" | "customPlanning"
  workloadType: "cowork"
  sourceGuideName: "Microsoft Copilot Credits Guide"
  sourceGuideVersion: "June 2026"
  usesOfficialGuideRanges: boolean
  usesAdvancedFactors: boolean
  hasOpenEndedHeavyRange: boolean
  heavyPlanningCap?: number | null
  maxIsOpenEnded: boolean
}
```

---

### 7. Modifica FP-008 — Assumption pack versionati

FP-008 deve essere aggiornata introducendo il pack di sistema:

```text id="7wegxt"
System Pack:
Microsoft Copilot Credits Guide — June 2026
```

Contenuto:

```text id="myj5so"
paygPricePerCredit = 0.01 USD

creditBands:
  light:
    min = 70
    mid = 135
    max = 200
    isOpenEnded = false

  medium:
    min = 400
    mid = 500
    max = 600
    isOpenEnded = false

  heavy:
    min = 1500
    mid = 1500
    max = null
    isOpenEnded = true
```

Il pack deve includere:

```text id="lmpmgi"
sourceGuideName = "Microsoft Copilot Credits Guide"
sourceGuideVersion = "June 2026"
sourceType = "officialGuide"
isSystem = true
isEditable = false
```

Regola:

* il pack system non è modificabile;
* può essere duplicato come custom;
* ogni duplicazione deve generare un custom pack;
* custom pack deve mostrare warning.

---

### 8. Modifica FP-009 — Funding plan e valorizzazione economica

## 8.1 PAYG

PAYG resta:

```text id="y3fkpr"
monthlyCost =
  monthlyCredits × 0.01
```

con:

```text id="2c9ti2"
currency = "USD"
```

---

## 8.2 P3 Pre-Purchase Plan

Il P3 deve essere modellato annualmente.

Tier disponibili:

```text id="hs2lhm"
Tier 1: 300,000 credits, 5% discount
Tier 2: 1,500,000 credits, 6% discount
Tier 3: 3,000,000 credits, 7% discount
Tier 4: 15,000,000 credits, 8% discount
Tier 5: 30,000,000 credits, 10% discount
Tier 6: 75,000,000 credits, 12% discount
Tier 7: 150,000,000 credits, 14% discount
Tier 8: 225,000,000 credits, 17% discount
Tier 9: 300,000,000 credits, 20% discount
```

Formula:

```text id="mr4eez"
basePaygEquivalentCost =
  annualPrepaidCredits × 0.01

annualPrepaidCost =
  basePaygEquivalentCost × (1 - discountPercentage / 100)

effectivePricePerCredit =
  annualPrepaidCost / annualPrepaidCredits
```

---

## 8.3 Consumo annuale stimato

```text id="gihbiq"
annualEstimatedCredits =
  monthlyEstimatedCredits × 12
```

---

## 8.4 Copertura P3

```text id="5w72y2"
annualCoveredByPrepaid =
  min(annualEstimatedCredits, annualPrepaidCredits)

annualPaygSpillover =
  max(annualEstimatedCredits - annualPrepaidCredits, 0)

annualUnusedExpiredCredits =
  max(annualPrepaidCredits - annualEstimatedCredits, 0)
```

---

## 8.5 Costo P3

```text id="x79hqn"
annualCost =
  annualPrepaidCost
  + annualPaygSpillover × paygPricePerCredit
```

Se spilloverMode = `additionalPurchase`, il sistema deve mostrare costo spillover come non determinato o richiedere selezione ulteriore.

Se spilloverMode = `blocked`, il sistema deve mostrare warning:

```text id="npar3v"
Estimated annual credits exceed prepaid credits.
```

---

## 8.6 Monthly allocation

La vista mensile del P3 deve essere marcata come allocazione di pianificazione.

```text id="eer5by"
monthlyAllocatedCost =
  annualCost / 12
```

Messaggio:

```text id="giyjv3"
Monthly P3 cost is shown as a planning allocation of the annual upfront purchase.
```

---

### 9. Modifica FP-006 — Gestione task preset

La gestione task preset deve essere aggiornata per supportare Heavy open-ended.

Nuovi campi task/credit band:

```text id="j06n8g"
isOpenEnded: boolean
planningCap?: number | null
requiresPlanningCap?: boolean
```

Regole:

* Light e Medium hanno min/mid/max chiusi;
* Heavy ha min e mid, ma max può essere `null`;
* se un report o export richiede max numerico, l’utente deve configurare planning cap;
* se planning cap manca, max scenario può essere open-ended.

Messaggio UI:

```text id="zsh4wf"
Heavy tasks are 1,500+ Copilot Credits. Add a planning cap if you need a numeric maximum estimate.
```

---

### 10. Modifica FP-011 — Breakdown risultati

Il breakdown deve mostrare:

* calculation mode;
* official guide pack;
* open-ended Heavy;
* eventuale planning cap;
* factor custom, se presenti;
* funding annual P3 vs monthly allocation.

Aggiungere colonne o badge:

```text id="kt6evl"
Calculation mode: Official Guide
Heavy range: 1,500+
P3 cost: annual upfront pool
Monthly cost: planning allocation
```

Se `maxIsOpenEnded = true`, nelle tabelle:

```text id="m1hvo0"
monthlyCreditsMax = "Open-ended"
```

oppure:

```text id="7xch0b"
monthlyCreditsMax = "1,500+ based"
```

---

### 11. Modifica FP-012 — Scenario comparison

La comparison deve evidenziare quando gli scenari confrontati usano modalità diverse.

Warning:

```text id="ya8egw"
Scenarios use different calculation modes. Differences may depend on methodology, not only usage.
```

Nuovi campi comparison:

```text id="f8xulo"
baselineCalculationMode
comparisonCalculationMode
sameCalculationMode: boolean
usesSameAssumptionPack: boolean
usesSameFundingConstruct: boolean
```

Regola:

* confronti tra Official Guide e Advanced Driver-Adjusted sono consentiti;
* devono però essere marcati come non pienamente omogenei.

---

### 12. Modifica FP-014 — Export CSV

Aggiungere a tutti gli export scenario le colonne:

```text id="2z9ig9"
calculation_mode
workload_type
source_guide_name
source_guide_version
uses_official_guide_ranges
uses_advanced_factors
has_open_ended_heavy_range
heavy_planning_cap
max_is_open_ended
funding_construct
p3_annual_prepaid_credits
p3_discount_percentage
p3_unused_expired_credits
p3_payg_spillover_credits
monthly_cost_is_allocation
```

Se il valore max è open-ended, esportare:

```text id="8xgnly"
monthly_credits_max = ""
monthly_credits_max_label = "Open-ended"
```

---

### 13. Modifica FP-015 — Export/import JSON

Aggiornare schema JSON aggiungendo:

```text id="lj7mwr"
calculationMode
workloadType
sourceGuide
creditBands.isOpenEnded
creditBands.planningCap
fundingPlan.construct
fundingPlan.p3AnnualPool
fundingPlan.unusedCreditsExpire
```

Nuova regola import:

* se uno scenario importato non ha `calculationMode`, trattarlo come legacy;
* se usa factor custom, assegnare `advancedDriverAdjusted`;
* se usa solo Light/Medium/Heavy range ufficiali, assegnare `officialGuide`;
* se non determinabile, assegnare `customPlanning` e `needsReview`.

---

### 14. Modifica FP-018 — How this was calculated

Il pannello deve mostrare una sezione iniziale:

```text id="ayxx7u"
Calculation methodology
```

Contenuti:

* Official Guide Mode;
* Advanced Driver-Adjusted Mode;
* Custom Planning Mode.

Per Official Guide Mode mostrare:

```text id="s8ua9h"
This estimate follows the planning methodology from the Microsoft Copilot Credits Guide: users by persona, monthly prompts by intensity, and estimated credits per prompt.
```

Per Advanced Driver-Adjusted Mode mostrare:

```text id="75rcr5"
This estimate applies custom planning factors for Models, Context, Tools, and Runtime. These factors are not a Microsoft rate card.
```

Per P3 mostrare:

```text id="5hib1t"
P3 is modeled as an annual upfront credit pool. Monthly cost is shown as a planning allocation.
```

---

### 15. Modifica FP-019 — Validazioni e warning

Aggiungere nuovi codici.

## 15.1 Calculation mode warnings

```text id="878z9h"
CALCULATION_ADVANCED_MODE
CALCULATION_CUSTOM_PLANNING_MODE
CALCULATION_MODE_MISMATCH_IN_COMPARISON
```

Messaggi:

```text id="5itwsh"
This scenario uses advanced custom planning factors beyond the official guide methodology.

This scenario uses custom planning assumptions and should be reviewed before sharing.

Compared scenarios use different calculation modes.
```

---

## 15.2 Heavy open-ended warnings

```text id="drcy4b"
HEAVY_RANGE_OPEN_ENDED
HEAVY_PLANNING_CAP_MISSING
HEAVY_MAX_NOT_NUMERIC
```

Messaggi:

```text id="3cvvub"
Heavy tasks are modeled as 1,500+ credits and do not have a fixed maximum.

Add a planning cap if you need a numeric max estimate.

The maximum estimate is open-ended because Heavy task max is not capped.
```

---

## 15.3 Workload scope warnings

```text id="i7rxhc"
WORKLOAD_NOT_SUPPORTED
WORKLOAD_NOT_COWORK
M365_NATIVE_EXPERIENCE_EXCLUDED
WORKIQ_API_NOT_INCLUDED
COPILOT_STUDIO_NOT_INCLUDED
BUSINESS_APPLICATIONS_NOT_INCLUDED
```

Messaggi:

```text id="pnckkz"
This calculator currently estimates Copilot Cowork only.

Microsoft 365 Copilot native experiences are excluded from this Cowork estimate.

Work IQ APIs are not included in this Cowork estimate.

Copilot Studio usage is not included in this Cowork estimate.
```

---

## 15.4 P3 funding warnings

```text id="msq2xq"
P3_UNUSED_CREDITS_EXPIRE
P3_PAYG_SPILLOVER
P3_MONTHLY_COST_IS_ALLOCATION
P3_ANNUAL_POOL_EXCEEDED
P3_LOW_UTILIZATION
```

Messaggi:

```text id="3cwbox"
Unused P3 credits expire at the end of the annual term.

Estimated usage exceeds prepaid credits and creates PAYG spillover.

Monthly P3 cost is shown as a planning allocation of the annual upfront purchase.

Estimated annual credits exceed the selected P3 pool.

The selected P3 tier may be underutilized.
```

---

### 16. Modifica FP-020 — Budget guardrails

Il budget deve distinguere tra:

* costo PAYG mensile reale stimato;
* costo P3 annuale upfront;
* costo mensile allocato per pianificazione.

Nuovi campi:

```text id="981p1u"
budgetEvaluationBasis:
  | "monthlyPayg"
  | "annualP3Commitment"
  | "monthlyP3Allocation"
```

Regola:

* con PAYG, il budget mensile confronta monthly cost;
* con P3, il budget annuale deve confrontare annual upfront commitment + spillover;
* se si mostra budget mensile P3, indicare che è allocation;
* se annual budget non è configurato con P3, generare warning informativo.

---

### 17. Modifica FP-021 — Report scenario

Il report deve aggiungere sezione:

```text id="1by288"
Source and calculation methodology
```

La sezione deve mostrare:

* guide source;
* guide version;
* calculation mode;
* workload type;
* assumption pack;
* Heavy open-ended status;
* funding construct;
* P3 annual pool, se usato;
* disclaimer.

Esempio contenuto:

```text id="dhu5sj"
This report estimates Microsoft Copilot Cowork only. It does not estimate Microsoft 365 Copilot native experiences, Work IQ APIs, Copilot Studio, Dynamics 365 agents, or Power Platform AI usage.
```

Se modalità avanzata:

```text id="pvhwgh"
This report uses advanced custom planning factors. These factors are not official Microsoft billing rates.
```

Se P3:

```text id="15pg3s"
The selected Pre-Purchase Plan is modeled as an annual upfront credit pool. Unused credits are treated as expiring at the end of the annual term.
```

---

### 18. Nuovi dati tecnici

## 18.1 Scenario

Aggiungere:

```text id="tc6eiz"
Scenario {
  workloadType: "cowork"
  calculationMode:
    | "officialGuide"
    | "advancedDriverAdjusted"
    | "customPlanning"
}
```

---

## 18.2 AssumptionPack

Aggiungere:

```text id="ek0p11"
AssumptionPack {
  sourceGuideName?: string
  sourceGuideVersion?: string
  sourceType: "officialGuide" | "custom" | "imported" | "legacy"
  creditBands: {
    light: CreditBand
    medium: CreditBand
    heavy: CreditBand
  }
}
```

---

## 18.3 CreditBand

Aggiungere:

```text id="bmtg51"
CreditBand {
  min: number
  mid: number
  max?: number | null
  isOpenEnded: boolean
  planningCap?: number | null
}
```

---

## 18.4 FundingPlan

Aggiungere:

```text id="8mlf2i"
FundingPlan {
  construct:
    | "payg"
    | "p3PrePurchase"
    | "existingCapacity"
    | "blended"
    | "custom"

  p3?: {
    tier: number
    annualPrepaidCredits: number
    discountPercentage: number
    annualPrepaidCost: number
    effectivePricePerCredit: number
    unusedCreditsExpire: boolean
    spilloverMode: "payg" | "additionalPurchase" | "blocked"
  }
}
```

---

## 18.5 CalculationTrace

Aggiungere:

```text id="8jj44v"
CalculationTrace {
  calculationMode: string
  workloadType: string
  sourceGuideName: string
  sourceGuideVersion: string
  officialGuideFormulaUsed: boolean
  advancedFactorsApplied: boolean
  heavyOpenEnded: boolean
  p3AnnualPoolApplied: boolean
}
```

---

### 19. Regole di retrocompatibilità

#### BR-FP023-001 — Scenario legacy

Se uno scenario esistente non contiene `calculationMode`, il sistema deve assegnare una modalità durante migrazione.

Regola proposta:

```text id="2g5ky7"
if scenario uses model/context/tools/runtime factors:
  calculationMode = "advancedDriverAdjusted"

else:
  calculationMode = "officialGuide"
```

Se non determinabile:

```text id="3143gn"
calculationMode = "customPlanning"
status = "needsReview"
```

---

#### BR-FP023-002 — Assumption pack legacy

Se un pack legacy non supporta Heavy open-ended, il sistema deve:

* mantenere il vecchio max se presente;
* marcare pack come legacy;
* suggerire migrazione o duplicazione dal nuovo system pack.

---

#### BR-FP023-003 — Funding legacy prepaid

Se un funding prepaid legacy usa logica monthly/12, il sistema deve:

* marcarlo legacy;
* migrare a P3 annual pool se i dati sono sufficienti;
* altrimenti marcarlo needsReview.

---

#### BR-FP023-004 — Calculation result legacy

Un calculation result legacy deve essere marcato stale o needsReview se mancano:

* calculationMode;
* source guide;
* Heavy open-ended info;
* funding construct.

---

### 20. Flusso principale — Nuovo scenario dopo CR-001

1. L’utente crea nuovo scenario.
2. Il sistema imposta:

   * workloadType = Cowork;
   * calculationMode = Official Guide;
   * assumption pack = Microsoft Copilot Credits Guide — June 2026.
3. L’utente configura segmenti/persona.
4. Per ogni segmento definisce:

   * utenti;
   * prompt Light;
   * prompt Medium;
   * prompt Heavy.
5. Se usa Heavy, il sistema mostra warning open-ended.
6. L’utente può inserire planning cap per Heavy max.
7. Il motore calcola min/mid/max.
8. L’utente configura funding PAYG o P3.
9. Se usa P3, il sistema calcola annual pool, spillover e unused credits.
10. Review, breakdown, report ed export mostrano calculation mode e source.

---

### 21. Flusso alternativo — Advanced mode

1. L’utente abilita Advanced Driver-Adjusted Mode.
2. Il sistema mostra warning metodologico.
3. L’utente configura model/context/tools/runtime factor.
4. Il motore applica factor.
5. Il calculation trace registra factor usati.
6. Report ed export marcano scenario come custom planning estimate.

---

### 22. Flusso alternativo — P3 annual pool

1. L’utente seleziona P3.
2. Sceglie tier.
3. Il sistema calcola:

   * annual prepaid credits;
   * annual prepaid cost;
   * effective price per credit.
4. Il sistema confronta annual estimated credits con annual prepaid credits.
5. Se consumo stimato eccede pool:

   * mostra spillover;
   * applica PAYG se configurato.
6. Se consumo stimato è inferiore al pool:

   * mostra unused credits;
   * indica che scadono a fine termine.
7. La vista mensile mostra allocazione, non billing mensile reale.

---

### 23. Validazioni principali

#### Errori bloccanti

* calculationMode mancante;
* workloadType mancante;
* workloadType diverso da Cowork nel motore Cowork;
* Heavy max richiesto ma planning cap mancante;
* P3 tier non valido;
* P3 annual credits mancanti;
* P3 discount non valido;
* funding construct non valido;
* schema import incompatibile.

#### Warning non bloccanti

* Heavy open-ended;
* Advanced mode;
* Custom planning mode;
* P3 unused credits expire;
* P3 spillover PAYG;
* P3 low utilization;
* scenario legacy migrated;
* comparison tra calculation mode diversi;
* Work IQ APIs esclusi;
* Copilot Studio escluso;
* M365 native experiences escluse.

---

### 24. Messaggi utente

| Caso                  | Messaggio                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Official mode         | “This scenario uses the Microsoft Copilot Credits Guide planning methodology.”               |
| Advanced mode         | “This scenario uses advanced custom planning factors beyond the official guide methodology.” |
| Custom mode           | “This scenario uses custom planning assumptions and should be reviewed before sharing.”      |
| Heavy open-ended      | “Heavy tasks are modeled as 1,500+ Copilot Credits.”                                         |
| Heavy cap missing     | “Add a planning cap if you need a numeric maximum estimate for Heavy tasks.”                 |
| P3 annual pool        | “P3 is modeled as an annual upfront credit pool.”                                            |
| P3 monthly allocation | “Monthly P3 cost is a planning allocation, not a separate monthly purchase.”                 |
| P3 unused expiry      | “Unused P3 credits expire at the end of the annual term.”                                    |
| P3 spillover          | “Estimated annual usage exceeds prepaid credits and creates spillover.”                      |
| Workload excluded     | “This calculator currently estimates Copilot Cowork only.”                                   |
| Native M365 excluded  | “Microsoft 365 Copilot native experiences are excluded from this Cowork estimate.”           |
| Report disclaimer     | “Values are planning estimates based on assumptions and are not official or binding prices.” |

---

### 25. Criteri di accettazione

#### AC-001 — Default Official Guide Mode

Given l’utente crea un nuovo scenario,
when lo scenario viene inizializzato,
then calculationMode = officialGuide.

---

#### AC-002 — Workload Cowork default

Given l’utente crea un nuovo scenario,
when lo scenario viene inizializzato,
then workloadType = cowork.

---

#### AC-003 — Official guide formula

Given scenario in officialGuide mode,
when il motore calcola crediti,
then usa utenti × prompt per intensità × crediti per prompt.

---

#### AC-004 — Range Light

Given il pack ufficiale June 2026,
when il sistema calcola task Light,
then usa range 70–200 crediti.

---

#### AC-005 — Range Medium

Given il pack ufficiale June 2026,
when il sistema calcola task Medium,
then usa range 400–600 crediti.

---

#### AC-006 — Heavy open-ended

Given il pack ufficiale June 2026,
when il sistema calcola task Heavy,
then tratta Heavy come 1,500+ crediti e non richiede max chiuso.

---

#### AC-007 — Heavy planning cap

Given l’utente inserisce planning cap per Heavy,
when il sistema calcola max,
then usa il planning cap come massimo numerico.

---

#### AC-008 — Heavy max senza cap

Given Heavy non ha planning cap,
when il sistema mostra max,
then mostra open-ended invece di un numero fittizio.

---

#### AC-009 — Advanced mode warning

Given l’utente abilita advancedDriverAdjusted,
when lo scenario viene calcolato,
then il sistema genera warning metodologico.

---

#### AC-010 — Custom factor non ufficiale

Given uno scenario usa factor custom,
when viene mostrato nel report,
then il report indica che non sono rate ufficiali Microsoft.

---

#### AC-011 — P3 tier

Given l’utente seleziona P3 Tier 5,
when il funding viene calcolato,
then annualPrepaidCredits = 30,000,000 e discount = 10%.

---

#### AC-012 — P3 annual cost

Given P3 annualPrepaidCredits e discount,
when il sistema calcola funding,
then annualPrepaidCost = annualPrepaidCredits × 0.01 × (1 - discount).

---

#### AC-013 — P3 spillover

Given annualEstimatedCredits supera annualPrepaidCredits,
when il sistema calcola funding,
then calcola annualPaygSpillover.

---

#### AC-014 — P3 unused expiration

Given annualEstimatedCredits è inferiore ad annualPrepaidCredits,
when il sistema calcola funding,
then calcola unusedExpiredCredits e mostra warning.

---

#### AC-015 — Monthly P3 allocation

Given uno scenario usa P3,
when la UI mostra monthly cost,
then indica che si tratta di allocazione mensile di pianificazione.

---

#### AC-016 — Workload non Cowork

Given workloadType diverso da Cowork,
when l’utente prova a usare il motore Cowork,
then il sistema blocca o mostra not supported.

---

#### AC-017 — Native M365 experiences escluse

Given l’utente visualizza report,
when legge lo scope,
then il report indica che le esperienze native Microsoft 365 Copilot sono escluse dalla stima Cowork.

---

#### AC-018 — Work IQ APIs escluse

Given l’utente visualizza report,
when legge lo scope,
then il report indica che Work IQ APIs non sono incluse nella stima Cowork.

---

#### AC-019 — Comparison mode mismatch

Given due scenari usano calculation mode diversi,
when vengono confrontati,
then la comparison mostra warning di metodologia diversa.

---

#### AC-020 — Export CSV aggiornato

Given scenario calcolato dopo CR-001,
when esporta CSV,
then il CSV include calculation mode, workload type, source guide e Heavy open-ended status.

---

#### AC-021 — Export JSON aggiornato

Given scenario calcolato dopo CR-001,
when esporta JSON,
then il JSON include calculationMode, workloadType, sourceGuide e P3 annual pool fields.

---

#### AC-022 — Report aggiornato

Given scenario calcolato dopo CR-001,
when visualizza report,
then il report mostra Source and calculation methodology.

---

#### AC-023 — Legacy migration

Given scenario creato prima di CR-001,
when viene caricato,
then il sistema assegna calculationMode o marca needsReview.

---

#### AC-024 — How calculated aggiornato

Given l’utente apre How this was calculated,
when lo scenario usa officialGuide mode,
then il pannello mostra la metodologia utenti/persona × prompt × intensità.

---

#### AC-025 — Nessuna regressione

Given scenario esistenti già validi,
when vengono migrati,
then i dati utente non vengono cancellati e il sistema mantiene tracciabilità legacy.

---

### 26. Priorità

Priorità funzionale: **Must have**

Questa FP è obbligatoria perché allinea l’app al documento Microsoft Copilot Credits Guide June 2026.

Senza questa modifica:

* il motore rischia di sembrare più preciso di quanto la guida consenta;
* i factor avanzati potrebbero essere interpretati come formula ufficiale;
* Heavy verrebbe trattato in modo errato come range chiuso;
* P3 verrebbe modellato impropriamente come semplice prezzo mensile;
* report ed export non spiegherebbero correttamente scope e limiti.

---

### 27. Note UX

Principi UX:

* Official Guide Mode deve essere il default;
* Advanced Mode deve essere accessibile ma chiaramente marcato;
* Heavy open-ended deve essere evidente;
* P3 annual pool deve essere spiegato con linguaggio semplice;
* monthly P3 allocation non deve sembrare billing mensile reale;
* report deve mostrare sempre source e methodology;
* export deve includere mode e source;
* warning non devono bloccare inutilmente ma devono essere visibili;
* lo scope “Cowork only” deve essere chiaro.

---

### 28. Note tecniche per sviluppo

Servizi da modificare:

* `calculationEngine`
* `assumptionService`
* `fundingCalculator`
* `validationService`
* `warningEngine`
* `breakdownBuilder`
* `comparisonService`
* `csvExportService`
* `jsonExportService`
* `reportService`
* `calculationTraceService`
* `migrationService`

Funzioni nuove o modificate:

```text id="a5f2pt"
calculateCoworkOfficialGuideEstimate(input)
calculateCoworkAdvancedDriverEstimate(input)
resolveCalculationMode(scenario)
validateWorkloadScope(scenario)
resolveOfficialGuideCreditBands(assumptionPack)
calculateOpenEndedHeavyRange(taskMix)
calculateP3AnnualFunding(fundingPlan, annualCredits)
calculateP3Spillover(fundingPlan, annualCredits)
calculateP3UnusedCredits(fundingPlan, annualCredits)
buildCalculationMethodologyTrace(result)
migrateLegacyCalculationMode(scenario)
```

Tipi nuovi o modificati:

```text id="v9i7x5"
CalculationMode
WorkloadType
CreditBandOpenEnded
OfficialGuideSource
P3FundingConstruct
CalculationMethodologyTrace
LegacyScenarioMigrationResult
```

---

### 29. Definizione di completato

La CR-001 può essere considerata completata quando:

* esiste `calculationMode`;
* esiste `workloadType`;
* Official Guide Mode è default;
* il motore usa formula utenti × prompt × intensità in Official Guide Mode;
* il pack “Microsoft Copilot Credits Guide — June 2026” è disponibile;
* Light usa range 70–200;
* Medium usa range 400–600;
* Heavy usa 1,500+ open-ended;
* Heavy supporta planning cap opzionale;
* Advanced Driver-Adjusted Mode resta disponibile;
* Advanced Mode genera warning metodologico;
* Custom Planning Mode genera warning metodologico;
* P3 è modellato come pool annuale upfront;
* P3 calcola spillover PAYG;
* P3 calcola unused expired credits;
* P3 monthly cost è marcato come allocation;
* Work IQ APIs sono esclusi dal motore Cowork;
* Copilot Studio è escluso dal motore Cowork;
* Microsoft 365 Copilot native experiences sono escluse dalla stima Cowork;
* breakdown mostra calculation mode;
* comparison mostra mismatch di modalità;
* CSV esporta nuovi campi;
* JSON esporta nuovi campi;
* report mostra source and methodology;
* How this was calculated mostra la metodologia corretta;
* validazioni e warning sono aggiornati;
* scenari legacy sono migrati o marcati needsReview;
* tutto funziona senza backend e resta compatibile con GitHub Pages.
