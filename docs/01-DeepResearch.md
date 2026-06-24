# Microsoft Copilot Cowork Credits Research and Static Estimator App Functional Analysis

## Executive findings

As of June 2026, Microsoft Copilot Cowork is generally available and is billed separately from the base Microsoft 365 Copilot user license. A Microsoft 365 Copilot license is a prerequisite, but Cowork itself has **no included entitlement** inside that subscription; usage is metered in **Copilot Credits** and billed according to the work Cowork performs. Microsoft started Cowork billing at general availability on June 16, 2026, while Frontier tenants that had real Cowork usage between March 30 and June 16 received a transition grace period until July 1, 2026. citeturn16view0turn31view0turn31view1

The main billing facts that are public are these: **pay-as-you-go is $0.01 per Copilot Credit**, credits are pooled at the tenant level, and Microsoft offers an annual **Copilot Credit Pre-Purchase Plan** with published tiered discounts from **5% to 20%**. Public documentation also says Cowork task cost is driven by four buckets: **models, context, tools, and runtime**. citeturn1view0turn23view0turn22view0

The key gap is that Microsoft has **not publicly published a deterministic Cowork rate card by model family**—for example, there is no public table saying “Claude Sonnet 4.6 = X credits, Claude Opus 4.8 = Y credits, GPT 5.5 = Z credits” for Cowork. Instead, Microsoft publishes broad **illustrative task bands** and says task cost varies with workflow complexity and usage patterns. That means any serious estimator you build today should be presented as a **transparent planning tool**, not a contractual quote engine. citeturn1view0turn18view0turn16view0

There is also a genuine **source inconsistency problem** already visible in public tooling. Microsoft’s current June 2026 Copilot Credits Guide expresses Cowork pricing as ranges—**Light 70–200 credits, Medium 400–600, Heavy >1500**—while a public browser-based estimator built from Frontier-era materials still uses **single-point defaults** and explicitly states that its assumptions are based on **Anthropic Opus 4.8**. This is the strongest argument for making your app support **versioned assumption packs**, editable defaults, and side-by-side scenario comparison. citeturn1view0turn10view0turn13view0

## Documented billing mechanics

Microsoft describes Copilot Credits as a **shared tenant-level currency** used across multiple Microsoft AI experiences, including Copilot Cowork, Copilot Studio, Dynamics 365 agents, Power Platform workloads, and Work IQ APIs. In the Microsoft 365 admin center, admins can allocate credits, apply policies by user or group, set limits, define alerts, and monitor usage by user, group, service, or agent. Microsoft’s public guidance also says organizations can fund usage through **pay-as-you-go, prepaid credits, or existing capacity**. citeturn1view0turn6view0turn25view1

Using Microsoft’s published **$0.01 per-credit PAYG rate** and the published **P3 discount tiers**, the effective list-equivalent pre-purchase amounts work out as follows. The dollar figures below are arithmetic derived directly from Microsoft’s listed per-credit PAYG price and its published P3 discount tiers. citeturn1view0turn22view0turn23view0turn26calculator0turn26calculator1turn26calculator2turn26calculator3turn27calculator0turn27calculator1turn27calculator2turn27calculator3turn27calculator4

| P3 tier | Credits | Published discount | Effective list-equivalent upfront cost | Effective price per credit |
|---|---:|---:|---:|---:|
| Tier 1 | 300,000 | 5% | $2,850 | $0.0095 |
| Tier 2 | 1,500,000 | 6% | $14,100 | $0.0094 |
| Tier 3 | 3,000,000 | 7% | $27,900 | $0.0093 |
| Tier 4 | 15,000,000 | 8% | $138,000 | $0.0092 |
| Tier 5 | 30,000,000 | 10% | $270,000 | $0.0090 |
| Tier 6 | 75,000,000 | 12% | $660,000 | $0.0088 |
| Tier 7 | 150,000,000 | 14% | $1,290,000 | $0.0086 |
| Tier 8 | 225,000,000 | 17% | $1,867,500 | $0.0083 |
| Tier 9 | 300,000,000 | 20% | $2,400,000 | $0.0080 |

For Cowork itself, Microsoft’s current public planning guide uses illustrative task bands rather than exact formulas. At PAYG list price, those bands translate to the following **minimum planning dollars per task**. citeturn1view0turn28calculator0turn28calculator1turn28calculator2turn28calculator3turn28calculator4

| Task intensity | Official illustrative band | PAYG list-price equivalent |
|---|---:|---:|
| Light | 70–200 credits | $0.70–$2.00 |
| Medium | 400–600 credits | $4.00–$6.00 |
| Heavy | >1500 credits | >$15.00 |

Microsoft’s own billing description is important for your calculator design because it makes clear that Cowork cost is **not just model inference cost**. Public docs say credit use varies by the mix of **models, runtime, context, and tools**, and separate admin documentation says that **model responses, tool and skill calls, image generation, and browser tasks** all count toward consumption. That means a realistic estimator must model more than “prompt count × model.” citeturn1view0turn25view1turn18view1

A second practical point: if a customer already owns **existing Copilot Credit capacity** elsewhere, your app should let them account for it. Microsoft’s setup guidance explicitly says usage-based billing can be configured with **prepaid credits, pay-as-you-go, or existing capacity**, and the Copilot Studio licensing guide says the Copilot Studio license includes **25,000 Copilot Credits per pack per month**. citeturn6view0turn22view0

## Current model landscape and what it implies for pricing

Microsoft’s current public Cowork model inventory includes **Auto**, **Claude Opus 4.8**, **Claude Sonnet 4.6**, **Sonnet + Opus Advisor**, **GPT 5.5 (Frontier)**, and **Imagen 2** for image generation. Microsoft says most users should leave Cowork on **Auto**, which chooses the model best suited to the task, but users can select a model family explicitly and admins can also restrict which models are available. Microsoft’s adoption materials additionally say Cowork currently runs on **Anthropic and OpenAI GPT 5.5**, while Microsoft’s own **Cowork 1** model is expected later and is positioned as a lower-cost option. citeturn18view0turn18view1turn9view0turn16view0

Microsoft’s documented positioning by model family is usable for an estimator, even though it is not a literal price sheet. In Microsoft’s public model guide, **Claude Sonnet 4.6** is framed as efficient for day-to-day drafting and faster responses, **Claude Opus 4.8** is framed for deep reasoning and high-stakes work, and **GPT 5.5** is described as versatile and strong for verbose writing and citations. The **Sonnet + Opus Advisor** mode uses Sonnet for the main turn and then has Opus review the result for quality and completeness. citeturn18view0turn18view2

There is an important regional and compliance caveat for model handling. Microsoft says Anthropic models are enabled by default for most commercial-cloud customers **except EU/EFTA and UK**, where they are disabled by default, and Anthropic processing is currently outside the Microsoft EU Data Boundary for these offerings. That matters because your estimator should let the user reflect whether Anthropic-based Cowork is even available in the target tenant. citeturn19view0turn19view1

Because Microsoft has not published Cowork-specific model multipliers, the best public proxy for **relative model intensity** comes from the underlying provider API list prices, used only as a heuristic. Public Anthropic pricing shows **Sonnet 4.6 at $3 input / $15 output per million tokens** and **Opus 4.8 at $5 input / $25 output per million tokens**. Public OpenAI pricing shows **GPT 5.5 at $5 input / $30 output per million tokens**. Those documents suggest, directionally, that Sonnet is the lower-cost family, Opus is more expensive, and GPT 5.5 is especially output-expensive relative to Sonnet. But because Cowork also bills **context, tools, and runtime**, these API prices should be used only to derive **relative weighting signals**, not direct Cowork credit conversion. citeturn24search1turn24search2turn24search3turn24search0turn1view0

A sensible implication for your estimator is this: model choice should be implemented as a **bounded multiplier on the model bucket**, not as a full “copy” of external token pricing. Put differently, Sonnet should default to the most efficient class, Opus to a premium class, GPT 5.5 to a premium-output class, and Advisor to a premium-plus class because it effectively adds a review pass. That is an inference from Microsoft’s Cowork architecture and the provider pricing signals, not an official Microsoft pricing rule. citeturn1view0turn18view0turn24search1turn24search2turn24search3

## What is still unknown and how to estimate responsibly

What Microsoft has **not** published publicly, as of June 24, 2026, is the exact Cowork conversion logic from task execution to credits. Public materials say the math depends on **models, context, tools, and runtime**, and Microsoft has announced that **user-level per-task pricing visibility in credits is “coming soon after GA.”** Until that visibility arrives, any estimator is fundamentally a planning model built on assumptions. citeturn1view0turn16view0

That uncertainty changes the right product design. Your estimator should not hard-code a single “truth.” It should support at least three assumption modes:

First, an **Official current range mode**, using Microsoft’s June 2026 public guide and treating Light, Medium, and Heavy as bands rather than single points. Second, a **Point estimate mode**, where the user explicitly chooses a representative point inside each band, such as midpoint, conservative percentile, aggressive percentile, or a custom value. Third, a **Versioned custom mode**, where the user saves their own numbers by company, by workforce segment, and by rollout phase. Microsoft itself recommends starting with user counts, then prompt volume by persona, then average price per prompt, and adjusting those assumptions over time. citeturn1view0turn31view1

The best calculation framework for the app is therefore:

**monthly credits** = sum over all workforce segments of  
**enabled users × active-use rate × monthly prompts by intensity × estimated credits per prompt**.

Then, within **estimated credits per prompt**, the app should separate a base intensity band from the cost drivers Microsoft has actually documented:

**estimated credits per prompt** =  
**base intensity credits × model factor × context factor × tools factor × runtime factor × optional browser/image factor**.

That exact multiplier structure is a product recommendation, but it reflects Microsoft’s public billing buckets and the documented fact that browser use, tool calls, skills, and image generation count toward consumption. citeturn1view0turn25view1

One more important boundary condition: your app should estimate **Cowork only**, not all Microsoft 365 Copilot usage. Microsoft’s June 2026 credits guide explicitly says the Microsoft 365 Copilot subscription still includes Copilot Chat, Copilot in Word/Excel/PowerPoint/Outlook/Teams, built-in agents such as **Researcher, Analyst, and Facilitator**, Work IQ grounding, and access to multiple models as part of the per-user license. The separate usage charges apply to **Cowork** and to **Work IQ APIs**, not to those built-in Microsoft 365 Copilot experiences. citeturn31view1

## Product gap analysis of the current estimator

The current public estimator at the GitHub Pages site is useful as a conversation starter, but it is intentionally narrow. Its page says its default assumptions are based on **Microsoft Frontier customer usage as of 5/27/2026** and explicitly **assume Anthropic Opus 4.8**. It also provides model guidance that recommends **Sonnet 4.6 for light and medium tasks** and **Opus 4.8 for heavy tasks**. citeturn10view0

In terms of features, the public app already exposes a **live calculator**, **scenario builder**, **budget and value calculator**, **summary**, **print / save PDF**, **download summary**, and **copy scenario link**. The public GitHub repository also describes it as a **browser-based static site for GitHub Pages with no backend required**. citeturn10view0turn13view0

At the same time, the public materials show exactly why it is not enough for your use case. The app is centered on a fixed set of workforce segments, a single planning surface, and a single estimation pass. The public repository README still documents **single-point defaults** for light/medium/heavy credits per prompt, whereas Microsoft’s current public guide now emphasizes **ranges** and variability. I also did not find public documentation for portfolio-style management of many companies, arbitrary custom workforce taxonomies, persistent saved estimations, or export/import of a scenario library. citeturn13view0turn1view0

That gap is the core product opportunity. Your app should become a **static, explainable cost workbench** for Cowork, not just a one-screen calculator.

## Functional specification for the new static estimator app

**Product goal.** Build a browser-only React application, deployable on GitHub Pages, that helps sellers, solution architects, and customer teams estimate Microsoft Copilot Cowork cost by company, by workforce segment, by rollout phase, and by task intensity. The app must remain assumption-based and explainable because Microsoft’s public Cowork pricing model is still published only as cost buckets and illustrative ranges, not as a deterministic per-model formula. citeturn1view0turn16view0

**Core objects.** The app should model five first-class objects: **Company**, **Workforce Segment**, **Scenario**, **Assumption Pack**, and **Funding Plan**. A Company stores the customer identity and portfolio metadata. A Workforce Segment stores a custom label such as white collar, blue collar, manager, executive assistant, sales, legal, engineering, plant supervisor, or any user-defined category. A Scenario stores the estimate itself. An Assumption Pack stores the versioned pricing logic and task bands. A Funding Plan stores PAYG, P3, and existing-capacity inputs. This structure is important because Microsoft’s own method is group-based—users by persona, prompts by persona, average price by prompt—and because billing policies in Microsoft 365 can also be scoped by **all users, security groups, or individual users**. citeturn31view1turn25view3

**Workforce modeling.** Each workforce segment should have at least these fields: total headcount, Cowork-enabled percentage, monthly active percentage, light prompts per active user, medium prompts per active user, heavy prompts per active user, preferred model family, and optional flags for browser-heavy work, image generation, plugin-heavy work, or long-running work. That lets the app represent a company like “500 employees, 20 managers, 40 white-collar knowledge workers, the rest blue collar,” while remaining flexible enough to model any real organization shape.

**Task presets.** The app should ship with two official preset families. The first should be **Current public guide presets**, based on Microsoft’s June 2026 bands: Light 70–200, Medium 400–600, Heavy >1500 credits. The second should be **Legacy Frontier-style presets**, clearly labeled as Opus-oriented historical assumptions derived from earlier public tooling. This is necessary because public Cowork estimator sources are already inconsistent, and customers will otherwise confuse “estimate” with “Microsoft contract price.” citeturn1view0turn10view0turn13view0

**Model handling.** The app should support at least these model choices in the UI: Auto, Claude Sonnet 4.6, Claude Opus 4.8, Sonnet + Opus Advisor, GPT 5.5 Frontier, and a placeholder for Cowork 1 when it becomes generally available. The app should not claim official Cowork price multipliers for these models, because Microsoft has not published them. Instead, it should use editable **relative model classes** with clear warning text: “These are estimator assumptions, not Microsoft billing rates.” The recommended default behavior is that **Auto** uses a blended factor, **Sonnet** is the efficient baseline, **Opus** is a premium factor, **Advisor** is a review-pass premium-plus factor, and **GPT 5.5** is a premium factor that skews higher for output-heavy tasks. citeturn18view0turn16view0turn24search1turn24search2turn24search3

**Calculation engine.** The engine should calculate three outputs at once: **credits**, **PAYG cost**, and **effective prepaid cost**. Credits come from the scenario assumptions. PAYG cost is straightforward at $0.01 per credit. Prepaid cost should support two modes: a simplified “effective rate” mode, where one P3 tier is applied across all modeled usage, and a more realistic blended mode, where the estimator first consumes **existing monthly credit packs or current prepaid pool**, then spills over to PAYG. This is justified by Microsoft’s published funding options and existing-capacity guidance. citeturn1view0turn6view0turn22view0turn23view0

**Company and portfolio views.** The app should have a single-company workspace and a multi-company portfolio workspace. The single-company view should answer: “What will this customer likely spend monthly and annually under these assumptions?” The portfolio view should answer: “Across all estimates I have built, what is my pipeline-weighted or scenario-weighted demand?” This is a material differentiator over the current public estimator.

**User flows.** The primary flow should be: create company → define workforce segments → choose or clone an assumption pack → enter adoption rates and prompt volumes → pick funding plan → review outputs → save scenario → export/share. Secondary flows should include clone scenario, compare two scenarios side by side, and convert a saved scenario into a shareable link.

**Persistence.** Because the app must stay static and serverless, saved data should live locally. The pragmatic design is to store the most recent working configuration in **localStorage** for instant recovery, and store the full company/scenario library in browser persistence with schema versioning so future app updates do not corrupt old saves. Every saved object should include `assumptionPackId`, `assumptionPackVersion`, and `sourceDate` so that estimates remain auditable when Microsoft changes published guidance.

**Sharing and portability.** Sharing should use **compressed JSON in the URL hash** for ad-hoc links and **JSON export/import** for durable backups. That keeps the app static and allows scenarios to be pasted into WhatsApp, Teams, or email without a backend. CSV export should work at two levels: a **scenario line-item CSV** and a **portfolio CSV**. The line-item export should include company name, scenario name, workforce segment, headcount, adoption fields, prompt volumes, model assumptions, credits, and costs. The portfolio export should aggregate by company and scenario.

**Transparency and explainability.** Every estimate page should expose a “How this was calculated” panel. The panel should show the exact formula, the intensity basis, the model basis, the funding basis, and the source/version stamp. This is not cosmetic. Microsoft’s own current public state is one of **documented variability**, not fixed rates, and Microsoft says full user-level per-task credit visibility is still coming after GA. citeturn16view0turn1view0

**Governance-minded outputs.** The summary screen should not stop at total cost. It should also show cost per active user, cost per enabled user, credits per segment, monthly versus annual view, scenario sensitivity, and a budget guardrail indicator. Microsoft’s own admin tooling focuses on limits, alerts, and scoped policies, so your app should mirror that mental model and make budget overruns obvious before deployment. citeturn6view0turn16view0turn25view1

**Recommended MVP.** The first release should include custom segments, versioned assumption packs, PAYG plus one P3 comparison, local saving, JSON/CSV export, shareable links, and side-by-side scenario comparison. The second release should add portfolio management, existing-capacity offsets, model-class sensitivity sliders, and more sophisticated browser/image/plugin workload modifiers.

**Implementation shape.** A React + TypeScript app with shadcn/ui is well suited to this. GitHub Pages deployment is viable because the current public Cowork estimator already proves that a **static, browser-only estimator** can deliver live calculations and exports without a backend. citeturn13view0

**Most important product rule.** The app should never present its result as “the cost.” It should present **a range, a midpoint, and the assumptions behind them**. That is the only intellectually honest way to estimate Cowork today, given Microsoft’s current public documentation state. citeturn1view0turn16view0turn18view0