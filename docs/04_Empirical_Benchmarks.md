---
schema_type: 'TechArticle'
title: '04. Praxeophysics Suite v4 Empirical Benchmarks & Simulation Report'
identifier: 'urn:praxeophysics:doc:benchmarks:v4:en'
name: 'Praxeophysics Suite v4 Empirical Benchmarks & Simulation Report'
version: '4.2.0'
author: 'Praxeophysics Institute'
datePublished: '2026-11-16'
description: 'Reproducible empirical benchmarks of the Dynamic Boundary Generative Model and Synallactics Protocol across 1,000 dyads, multi-scale pools (M=20, 100), EFE exploration, and four cross-domain killer use-cases'
tags:
  - 'praxeophysics'
  - 'simulation-benchmarks'
---

## Overview: Empirical Validation of Non-Price Mutual Reconciliation

This report documents the empirical benchmarks of the **Dynamic Boundary Generative Model** and **Synallactics Protocol** implemented in `@praxeophysics/core v4.2.0`. All simulations were executed deterministically in Node.js (Suite v4) applying **4% per-epoch exogenous stress shocks** (+0.50 allostatic load spikes), **ambient noise** (0.08), and an explicit **$\kappa = 0.20$ interface-translation drag** on `INTERFACE_DECOUPLING`.

* **Portal Home**: [[index|Portal Home]]
* **Protocol Specification**: [[01_Specification|Praxeophysics Protocol Specification]]
* **Canonical Glossary**: [[02_Glossary|Praxeophysics Canonical Glossary]]
* **Six Fundamental Trade-offs**: [[03_Breakthroughs|Six Fundamental Trade-offs and Twelve Pathologies]]
* **Canonical Index**: [[00_Canonical_Index|Canonical Knowledge Index]]

---

## 1. Experiment 1: Dyadic Coupling Budget Sweep via Boundary Envelopes

We evaluated $N = 1,000$ dyads over 30 epochs ($D = 5$, $\kappa = 0.20$) across increasing attentional precision budgets $\Pi_{\text{budget}} \in \{15, 30, 50, 100\}$. At each epoch, agents export strictly their [[Term_Boundary_Envelope|Boundary Envelopes]] $[a_d(t), b_d(t)]$ without revealing internal precision $\boldsymbol{\Pi}$ or load $L(t)$.

| $\Pi_{\text{budget}}$ | Strategy | Boundary Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | COMP_DEL (%) | INTF_DEC (%) | EXIT_SORT (%) | LOAD_REL (%) |
| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 15 | `SCALAR_MIDPOINT` | 0.14% | 0.2022 | 0.21% | 0.00% | - | - | - | - |
| 15 | `PRAXEOPHYSICS` | **0.00%** | **0.0474** | 0.20% | **0.00%** | 10.82 | 88.73 | 0.05 | 0.40 |
| 30 | `SCALAR_MIDPOINT` | 1.34% | 0.3501 | 0.24% | 0.00% | - | - | - | - |
| 30 | `PRAXEOPHYSICS` | **0.01%** | **0.0737** | 0.20% | **0.00%** | 14.85 | 83.82 | 0.93 | 0.40 |
| 50 | `SCALAR_MIDPOINT` | 2.19% | 0.4696 | 0.34% | 0.01% | - | - | - | - |
| 50 | `PRAXEOPHYSICS` | **0.01%** | **0.0842** | 0.16% | **0.00%** | 18.39 | 79.70 | 1.58 | 0.33 |
| 100 | `SCALAR_MIDPOINT` | 2.83% | 0.6414 | 0.72% | 0.28% | - | - | - | - |
| 100 | `PRAXEOPHYSICS` | **0.01%** | **0.0863** | 0.23% | **0.00%** | 19.38 | 78.39 | 1.77 | 0.46 |

### Key Findings
* **283x Violation Reduction**: At $\Pi_{\text{budget}} = 100$, conventional midpoint averaging incurs a 2.83% violation rate, whereas Boundary-Envelope reconciliation suppresses violations to **0.01%**.
* **7.4x Reduction in Variational Friction**: Mean Variational Free Energy is lowered from 0.6414 to **0.0863**.
* **Elimination of Post-Learning Chronic Overload**: Under `SCALAR_MIDPOINT`, 0.28% of agents enter irreversible chronic burnout; under `PRAXEOPHYSICS`, `ALLOSTATIC_LOAD_RELIEF` restores homeostatic capacity before damage compounds (**0.00%** post-overload).

---

## 2. Experiment 2: Multi-Scale Pool Cohort Sorting ($M = 20$ vs. $M = 100$)

We evaluated cohort formation across constrained pools ($M = 20$ agents $\times 25$ pools) and large-scale pools ($M = 100$ agents $\times 10$ pools) over 30 epochs ($D = 4$, $\Pi_{\text{budget}} = 80$, $\kappa = 0.20$).

| Pool Size $M$ | Strategy | Active Cohort (%) | Mean Size | Load Relief (%) | Solo Niche (%) | Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | Terminal Cap ($1-L$) |
| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 | `SCALAR_NEAREST_K2` | 100.00% | 2.00 | 0.00% | 0.00% | 0.70% | 0.1623 | 0.17% | 0.03% | 0.9709 |
| 20 | `SCALAR_WEIGHTED_K2` | 100.00% | 2.00 | 0.00% | 0.00% | 0.01% | 0.0578 | 0.24% | 0.00% | 0.9838 |
| 20 | `PRAXEOPHYSICS_COHORT_K2` | 99.68% | 2.00 | 0.16% | 0.16% | **0.00%** | **0.0189** | 0.16% | **0.00%** | **0.9804** |
| 20 | `PRAXEOPHYSICS_COHORT_K4` | 99.81% | 3.99 | 0.17% | 0.02% | **0.00%** | 0.0331 | 0.17% | **0.00%** | 0.9798 |
| 100 | `SCALAR_NEAREST_K2` | 100.00% | 2.00 | 0.00% | 0.00% | 0.14% | 0.0621 | 0.18% | 0.00% | 0.9728 |
| 100 | `SCALAR_WEIGHTED_K2` | 100.00% | 2.00 | 0.00% | 0.00% | 0.13% | 0.0463 | 0.30% | 0.09% | 0.9736 |
| 100 | `PRAXEOPHYSICS_COHORT_K2` | 99.70% | 2.00 | 0.16% | 0.14% | **0.00%** | **0.0107** | 0.16% | **0.00%** | **0.9805** |
| 100 | `PRAXEOPHYSICS_COHORT_K4` | 99.78% | 3.99 | 0.22% | 0.00% | **0.00%** | 0.0192 | 0.22% | **0.00%** | 0.9793 |

### Key Findings
* **Defeating Precision-Weighted Baselines**: Across both small ($M=20$) and large ($M=100$) pools, `PRAXEOPHYSICS_COHORT_K2` achieves **0.00% violations** and outperforms precision-weighted scalar consensus (`SCALAR_WEIGHTED_K2`: 0.0578 VFE at $M=20$; 0.0463 VFE at $M=100$).
* **Scaling to 4-Member Cliques (`K4`)**: Applying Helly's Theorem to orthogonal intervals allows cohort expansion to $K=4$ with **0.00% boundary violations** and low joint VFE (0.0192 at $M=100$).

---

## 3. Experiment 3: Epistemic Exploration & Information Gain under EFE $G(\pi)$

We tested whether homeostatic boundary protection unlocks autonomous epistemic exploration ($D_{\mathrm{KL}}$ information gain) rather than inducing Dark-Room stagnation ($N = 500$ dyads $\times 30$ epochs, $D = 5$, $\Pi_{\text{budget}} = 100$, $\kappa = 0.20$).

| Strategy | Mean Epistemic Gain (nats) | Frontier Exploration (%) | Dark-Room Retreat (%) | Guardrail Violation (%) |
| :--- | ---: | ---: | ---: | ---: |
| `SCALAR_MIDPOINT` | 0.4250 | 71.21% | 12.44% | 3.88% |
| `PRAXEOPHYSICS` | **0.4963** | **76.26%** | **0.22%** | **0.02%** |

### Key Findings
* **Unlocking Epistemic Value**: By unpenalizing interior variance $\sigma_{\pi,d}^2$ inside the viable Boundary Envelope, agents expand frontier exploration from 71.21% to **76.26%** (0.4963 vs. 0.4250 nats/decision).
* **Conquering the Dark-Room Paradox**: Under midpoint friction, exhausted agents retreat to zero-variance stagnation 12.44% of the time; under `PRAXEOPHYSICS`, Dark-Room retreat collapses to **0.22%**.

---

## 4. Experiment 4: Epoch Learning Hyperparameter Sensitivity

We evaluated closed-loop learning stability across retention factor $\lambda$ and friction accumulation gain $\alpha$ ($N = 500$ dyads $\times 30$ epochs, $D = 5$, $\Pi_{\text{budget}} = 80$, $\kappa = 0.20$).

| $\lambda$ (Load Decay) | $\alpha$ (Load Gain) | Boundary Violation (%) | Mean VFE | Mean Terminal Capacity ($1-L$) |
| ---: | ---: | ---: | ---: | ---: |
| 0.50 | 0.10 | 0.01% | 0.0855 | 0.9934 |
| 0.70 | 0.15 | 0.01% | 0.0854 | 0.9755 |
| 0.85 | 0.25 | 0.02% | 0.0858 | 0.9601 |

The closed loop exhibits robust mathematical stability across the parameter space, with terminal homeostatic capacity remaining above 0.96 throughout.

---

## 5. Experiment 5: Cross-Domain Killer Use-Case Benchmarks (Domains 1–4)

### 5A. Silent Hospitality, Salon, Mobility & Retail Alignment ($N = 1,000$ sessions, $D = 4$)
Evaluates the dilemma of silent customers who suffer boundary violations (tactile hypersensitivity, quiet ride preferences, dietary caps) rather than verbally confessing vulnerabilities.

| Strategy | Silent Churn / Violation (%) | Mean VFE | Bayesian Attribution Risk (%) |
| :--- | ---: | ---: | ---: |
| `POLITE_SILENCE_TATEMAE` | 74.10% | 2.9526 | 0.00% |
| `VERBAL_CONFESSION` | 0.00% | 0.0101 | 100.00% |
| `PRAXEOPHYSICS_DENIABLE_ENVELOPE` | **0.00%** | **0.0102** | **30.61%** |

*Under logical-OR pooling ($z_d = x_{\text{sens},d} \lor x_{\text{pref},d}$), Bayesian attribution risk is bounded to **30.61%**, eliminating silent churn without privacy stigma.*

### 5B. 4-Person Group Dining & Travel Coordination ($N = 500$ groups of 4, $D = 4$)
Evaluates groups attempting to pick restaurants or travel itineraries under unspoken budget ceilings, dietary limits, and fatigue curfews.

| Strategy | Group Success Rate (%) | Hidden Violation Group (%) | Mean Member VFE | Bayesian Attribution Risk (%) |
| :--- | ---: | ---: | ---: | ---: |
| `GROUP_CHAT_TATEMAE` | 0.00% | 100.00% | 3.9720 | 0.00% |
| `RAW_GROUP_CONFESSION` | 100.00% | 0.00% | 0.8179 | 100.00% |
| `PRAXEOPHYSICS_ENVELOPE_INTERSECTION` | **100.00%** | **0.00%** | **0.8179** | **30.61%** |

*Breaks the polite-silence deadlock: group satisfaction reaches **100.00%** while keeping personal boundaries deniable.*

### 5C. Dating, Marriage & Co-Living Relational Topologies ($25$ pools $\times 40$ agents = 1,000 agents, $D = 6$)
Evaluates long-term co-living compatibility across surface hobbies (2 dims) and core lifestyle guardrails (4 dims: finances, hygiene, noise, solitude).

| Strategy | Co-Living Breakup (%) | Mean Pair VFE | Reciprocal Duality (%) | Modular Parallelism (%) |
| :--- | ---: | ---: | ---: | ---: |
| `DATING_APP_1D_HOBBY` | 26.80% | 0.6225 | 0.00% | 0.00% |
| `HOMOGENEITY_6D_MIDPOINT` | 9.00% | 0.3092 | 0.00% | 0.00% |
| `PRAXEOPHYSICS_RELATIONAL_TOPOLOGY` | **0.00%** | **0.0491** | **20.00%** | **80.00%** |

*Pre-screening dealbreakers via ZKP eliminates breakups (**0.00%**), while the Silver Ratio partitions life domains into Reciprocal Duality (`COMPLEMENTARY_DELEGATION`: 20%) and Modular Parallelism (`INTERFACE_DECOUPLING`: 80%).*

### 5D. Bilateral Freelance / ADR Contract Settlement ($N = 1,000$ viable deals, $p_{\text{ref}} \sim \mathcal{U}(0.35, 0.65)$)
Evaluates bilateral contracting under private reservation floors ($v_A^{\min}$) and ceilings ($v_B^{\max}$) subject to strategic bluffing under the Myerson-Satterthwaite theorem.

| Strategy | Deal Settlement Rate (%) | Strategic Bluff Incentive (%) | Reservation Exposure (%) |
| :--- | ---: | ---: | ---: |
| `SPLIT_DIFFERENCE_BLUFFING` | 67.60% | 100.00% | 100.00% |
| `PLAIN_MEDIATOR_ESCROW` | 75.00% | 0.00% | 100.00% |
| `PRAXEOPHYSICS_POSTED_REFERENCE_ZKP` | **75.00%** | **0.00%** | **0.00%** |

*Eliminates strategic posturing (**0.00%**) and private limit leakage (**0.00%**) while maximizing viable settlement efficiency (**75.00%**).*

---

## 6. How to Reproduce Locally

The entire simulation suite is automated and verifiable with Node.js:

```bash
git clone https://github.com/praxeophysics/protocol.git
cd protocol
npm install
npm test            # Runs 12 automated unit, schema, and property test suites
npm run benchmark   # Runs Suite v4 and outputs full benchmark_results.json
```
