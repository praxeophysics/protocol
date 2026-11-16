# Non-Price Mutual Reconciliation via Dynamic Boundary Generative Models: The Principle of Interior Opacity, Boundary-Envelope Calculus, and Empirical Benchmarks

**Version**: 4.2.0 (Formal Decision Model & Reference Architecture)  
**Author**: Praxeophysics Institute (Lead Praxeophysicist)  
**Date**: 2026-11-15 (Baseline Prior IP `v4.0.0` Timestamp: 2026-08-31)  
**Licenses**: Specification & Paper under CC BY 4.0 International; Reference Code & Schemas under Apache License 2.0  
**Repository**: `https://github.com/praxeophysics/protocol` | **Portal**: `https://praxeophysics.org`

---

## Abstract

Monetary markets (*Catallactics*) coordinate fungible commodities through one-dimensional price signals, while bureaucratic standardization imposes uniform thresholds across heterogeneous populations. Conventional algorithmic matching attempts to bridge non-price coordination by modeling agents as positive interior points and maximizing scalar similarity scores. We demonstrate that positive interior modeling fails across three orthogonal axes: it violates Markov-blanket conditional independence (*Ontology*), crowds out unformalizable tacit knowledge $\ker\Phi$ or collapses orthogonal constraints (*Epistemology*), and incentivizes strategic misrepresentation under private information (*Teleology*).

To resolve this impasse, we formulate the **Principle of Interior Opacity and Apoha Boundary Sufficiency** (`C15 (Claim_Interior_Opacity_Principle)`) within the **Dynamic Boundary Generative Model** and **Praxeophysics Protocol** for non-price mutual reconciliation (*Synallactics*). Instead of exposing or optimizing interior generative states $(\boldsymbol{\mu}, \boldsymbol{\Pi}, L(t))$, each agent's local Personal Data Store (`Holder`) exports strictly a negative **Boundary Envelope** $\mathcal{U}_{i,d}(t) = [a_{i,d}(t), b_{i,d}(t)] = [\mu_{i,d} - r_{i,d}(t), \mu_{i,d} + r_{i,d}(t)]$ where $r_{i,d}(t) = \sqrt{2(1 - L_i(t)) / \Pi_{i,d}}$, redacting bounds entirely during acute overload ($L_i(t) \ge \theta_L$). We prove that exported boundary intervals alone—via effective boundary stiffness $\widetilde{\Pi}_{i,d} = 2 / r_{i,d}(t)^2$ and the closed-form Silver-Ratio threshold $\max(r_{B,d}/r_{A,d}, r_{A,d}/r_{B,d}) > 1 + \sqrt{2} \approx 2.414$—suffice to compute topological satisfiability and dispatch four reconciliation directives (**Complementary Delegation**, **Interface Decoupling**, **Allostatic Load Relief**, and **No-Fault Cohort Sorting**) without revealing raw precision weights or continuous load. Furthermore, we formalize Expected Free Energy ($G(\pi)$) policy selection under boundary-envelope inclusion, proving that preserving interior tacit freedom resolves the Dark-Room Paradox and unlocks epistemic exploration ($D_{\mathrm{KL}}$ information gain).

Reproducible TypeScript simulations (Suite v4 across 1,000 dyads and multi-scale pools $M \in \{20, 100\}$ over 30 epochs with 4% stress shocks and $\kappa = 0.20$ interface-translation drag) confirm that: (1) at $\Pi_{\text{budget}} = 100$, Boundary-Envelope reconciliation cuts guardrail violations from 2.83% to **0.01%**, lowers mean VFE from 0.6414 to **0.0863**, and eliminates chronic post-overload (**0.00%** vs. 0.28%); (2) across both constrained ($M=20$) and large ($M=100$) pools, `PRAXEOPHYSICS_COHORT_K2` achieves **0.00%–0.00%** violations and **0.0189** ($M=20$) / **0.0107** ($M=100$) mean VFE, outperforming both unweighted nearest-neighbor pairing (0.14% violations, 0.0621 VFE at $M=100$) and precision-weighted point consensus (`SCALAR_WEIGHTED_K2`: 0.0578 VFE at $M=20$, 0.0463 VFE at $M=100$) while scaling to 4-member cohorts (`K4`: 0.00% violations, 0.0192 VFE); and (3) under Expected Free Energy evaluation, guardrail protection increases frontier epistemic exploration from 71.21% to **76.26%** (0.4963 vs. 0.4250 nats/decision).

---

## 1. Introduction: The Impasse of Positive Interior Optimization & The Apoha Inversion

Socio-technical coordination relies predominantly on uniform bureaucratic standards (violating Ashby's Law of Requisite Variety; Ashby, 1956) or monetary market exchange (*Catallactics*; Mises, 1949; Hayek, 1945). When coordinating non-price somatic, cognitive, or collaborative boundaries, conventional algorithms model each agent as a static interior point $\boldsymbol{\mu}_i$ and optimize a positive cardinal similarity score or midpoint average $u = (\mu_A + \mu_B)/2$.

We identify the **Principle of Interior Opacity and Apoha Boundary Sufficiency** (`C15 (Claim_Interior_Opacity_Principle)`):
1. **Why Positive Interior Modeling Fails**: Directly inspecting or optimizing interior states $(\boldsymbol{\mu}_i, \ker\Phi_i)$ violates Markov-blanket conditional independence (Friston, 2019; Parr et al., 2020), over-specifies embodied tacit routines $\ker\Phi_i$ (Polanyi, 1966) or collapses orthogonal constraints into 1D scalars, and triggers strategic misrepresentation under private information (Myerson & Satterthwaite, 1983).
2. **The Praxeophysical Inversion**: The protocol abandons positive modeling of interior preferences and operates strictly on the **negative outer boundary of homeostatic breakdown**—demarcated via *apoha* exclusion (Tillemans, 2021) as a **Boundary Envelope** $\mathcal{U}_{i,d}(t) = [a_{i,d}(t), b_{i,d}(t)]$. Inside the viable interior $\operatorname{int}(\mathcal{U}_{i,d}(t))$, the agent's tacit autonomy remains completely opaque and unregimented.

---

## 2. Related Work & Positioning

| Domain | Literature | Foundation Adopted | Specific Extension in Praxeophysics |
| :--- | :--- | :--- | :--- :---
| **FEP & Statistical Physics** | Friston (2019); Parr et al. (2020); Vasil et al. (2020) | Markov blankets, VFE/EFE, precision weighting | Boundary-Envelope calculus, Silver-Ratio threshold, and EFE exploration unlocking |
| **Cybernetics & Systems** | Ashby (1956); Bateson (1972); Simon (1962) | Requisite Variety, schismogenesis, Bounded Rationality, Near Decomposability | Modular attribute-rule decoupling ($\mathbf{x} \perp R_c$) and VFE-optimal SAT clique sorting |
| **Epistemology** | Polanyi (1966); Tillemans (2021); Westerhoff (2024) | Tacit margin, *apoha* exclusion boundaries, non-reification | Principle of Interior Opacity: restricts protocol claims strictly to negative boundary envelopes |
| **Mechanism Design & Law** | Mises (1949); Coase (1960); Myerson & Satterthwaite (1983); Hirschman (1970); Ostrom (2010a, 2010b) | Subjective value, transaction costs, bilateral impossibility, Exit, polycentricity | Posted-reference ZKP settlement combined with non-penalized cohort sorting |
| **Privacy & Identity** | Dwork (2006); W3C VC v2.0 (2025) | Differential privacy, selective disclosure & ZKP claims | Within-dimension inverse precision inference, envelope redaction, and OR/RR pooling |

---

## 3. Formal Mathematical Model

### 3.1 Dimensionless State Space, Inverse Precision Inference & Boundary Envelopes
Inputs are normalized onto $[0, 1]^D$ via shared ontology reference scales. Under a diagonal Laplace approximation $\mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Pi}^{-1})$, an agent retains $(\boldsymbol{\mu}, \boldsymbol{\Pi}, L(t))$ locally in its `Holder` subject to $\sum_{d=1}^D \Pi_d \le \Pi_{\text{budget}}$ and $L(t) \in [0, 1)$. Bounding instantaneous friction $F_d(s_d) = \frac{1}{2}\Pi_d(s_d - \mu_d)^2 \le 1 - L(t)$ yields binary predicates and **Allowable Tolerance Radii**:

$$x_d(t) = \mathbb{I}\!\left(\frac{1}{2}\Pi_d(s_d - \mu_d)^2 \le 1 - L(t)\right) \iff s_d \in \mathcal{U}_d(t) = [a_d(t), b_d(t)] = [\mu_d - r_d(t), \, \mu_d + r_d(t)], \quad r_d(t) = \sqrt{\frac{2(1 - L(t))}{\Pi_d}}$$

Rather than transmitting raw $(\boldsymbol{\mu}, \boldsymbol{\Pi}, L(t))$, `exportBoundaryEnvelope` emits only $\ell = \mathbb{I}(L(t) \ge \theta_L)$ and (when $\ell = 0$) the interval endpoints $[a_d(t), b_d(t)]$, compressing $\Pi_d$ and $L(t)$ into the single half-width $r_d(t) = (b_d - a_d)/2$.

### 3.2 Boundary-Envelope Calculus & the Silver-Ratio Threshold
Given two exported envelopes $[a_{A,d}, b_{A,d}]$ and $[a_{B,d}, b_{B,d}]$ with centers $c_{i,d} = (a_{i,d} + b_{i,d})/2$ and half-widths $r_{i,d} = (b_{i,d} - a_{i,d})/2$, topological intersection (**SAT**) holds iff $\max(a_{A,d}, a_{B,d}) \le \min(b_{A,d}, b_{B,d})$. Defining each agent's **Effective Boundary Stiffness** $\widetilde{\Pi}_{i,d} \equiv \frac{\Pi_{i,d}}{1 - L_i(t)} = \frac{2}{r_{i,d}^2}$, midpoint compromise friction decomposes identically into minimal joint friction plus asymmetry reduction gain:

$$u^*_d = \frac{r_{B,d}^2 c_{A,d} + r_{A,d}^2 c_{B,d}}{r_{A,d}^2 + r_{B,d}^2}, \qquad \widetilde{F}_{\text{mid}}(d) = \underbrace{\frac{1}{2}\frac{\widetilde{\Pi}_{A,d}\widetilde{\Pi}_{B,d}}{\widetilde{\Pi}_{A,d} + \widetilde{\Pi}_{B,d}}\Delta c_d^2}_{\widetilde{F}^*_{\text{joint}}(d)} + \underbrace{\frac{1}{8}\frac{(\widetilde{\Pi}_{A,d} - \widetilde{\Pi}_{B,d})^2}{\widetilde{\Pi}_{A,d} + \widetilde{\Pi}_{B,d}}\Delta c_d^2}_{\Delta \widetilde{F}_{\text{asym}}(d)}$$

Consequently, `reconcileEnvelopes` determines the exact branching threshold between **Complementary Delegation** and **Interface Decoupling** purely from the ratio of interval widths (the **Silver Ratio** $1 + \sqrt{2} \approx 2.414$) without ever inspecting raw $\Pi_d$ or $L(t)$:

$$\Delta \widetilde{F}_{\text{asym}}(d) > \widetilde{F}^*_{\text{joint}}(d) \iff \max\!\left(\frac{\widetilde{\Pi}_{A,d}}{\widetilde{\Pi}_{B,d}}, \frac{\widetilde{\Pi}_{B,d}}{\widetilde{\Pi}_{A,d}}\right) > (1 + \sqrt{2})^2 \approx 5.828 \iff \max\!\left(\frac{r_{B,d}}{r_{A,d}}, \frac{r_{A,d}}{r_{B,d}}\right) > 1 + \sqrt{2}$$

### 3.3 Expected Free Energy ($G(\pi)$) & Resolution of the Dark-Room Paradox
If internal precision $\Pi_d$ penalizes exploration variance $\sigma_{\pi,d}^2$ inside the viable boundary ($\frac{1}{2}\Pi_d \sigma_{\pi,d}^2$), the inequality $x > \ln(1 + x)$ traps the agent in the Dark Room ($\sigma_{\pi,d}^2 = 0$). By Two-Truths Separation (`C14 (Claim_Two_Truths_Tacit_Separation)`) and Interior Opacity (`C15 (Claim_Interior_Opacity_Principle)`, `C31 (Claim_Homeostatic_Capacity_Unlocks_Exploration)`), exploration variance inside the Boundary Envelope is unpenalized, while the guardrail enforces envelope inclusion $\lvert \hat{s}_{\pi,d} - \mu_d \rvert + \sigma_{\pi,d} \le r_d(t)$:

$$G(\pi) = \underbrace{\sum_{d=1}^D \frac{1}{2}\Pi_d(\hat{s}_{\pi,d} - \mu_d)^2}_{\text{Pragmatic Risk } F_{\text{prag}}(\pi)} - \gamma_{\text{epistemic}} \underbrace{\sum_{d=1}^D \frac{1}{2}\ln\!\left(1 + \Pi_d \sigma_{\pi,d}^2\right)}_{\text{Epistemic Value } I_{\text{epistemic}}(\pi)}, \quad \text{s.t. } \frac{1}{2}\Pi_d\left(\lvert \hat{s}_{\pi,d} - \mu_d \rvert + \sigma_{\pi,d}\right)^2 \le 1 - L(t)$$

---

## 4. Reference Architecture & Machine-Verifiable Interfaces

The Praxeophysics Protocol implements four Markov-blanket-aligned pipelines—**Ingestion**, **Storage (`Holder`)**, **Verification**, and **Reconciliation Adapter**—grounded in Coasean boundary delineation (Coase, 1960) and Near Decomposability (Simon, 1962), verified by Draft 2020-12 JSON Schemas (`schemas/boundary-claim.v4.2.schema.json`, `schemas/a2a-handshake.v4.2.schema.json`) and 12 automated test suites (`tests/praxeophysics-core.test.mjs`, 12/12 passing).

---

## 5. Threat Model, Game-Theoretic Scope, and Limitations

1. **Precision Inflation vs. Interval-Center Shifting**: Proportional budget normalization ($\sum \Pi_d \le \Pi_{\text{budget}}$) and UNSAT contraction ($r_{\min} \ll 1$ for $\Pi_{\text{budget}} \ge 50\text{--}100$) deter strategic $\Pi_d$ inflation, and `exportBoundaryEnvelope` hides raw $\Pi_d$ and $L(t)$; however, `reconcileEnvelopes` / `reconcileCoupling` is not DSIC against strategic shifting of interval centers $c_d = \mu_d$ inside a SAT interval. Domain 3 coupling assumes cooperative contexts or sensor/log-attested commitments, whereas unattested strategic bargaining is restricted to Domain 4 Posted-Reference ZKP Settlement (`evaluateStrategyProofSettlement`, $v_A^{\min} \le p_{\text{ref}} \le v_B^{\max}$).
2. **Synthetic Epoch Dynamics vs. Biological Allostasis**: The linear leaky-integrator parameters ($\lambda, \alpha, \beta, \eta_\mu, \eta_\Pi$) in `stepEpochLearning` are synthetic proof-of-concept baselines demonstrating closed-loop convergence; they do **not** capture biological non-linearities, burnout hysteresis, delayed allostatic responses, or inter-individual variance, nor does Layer 0 provide a biometric sensor oracle for $L(t)$. While static and semi-static Boundary-Envelope reconciliation (`reconcileEnvelopes`) operates immediately on any well-defined interval $[a_d, b_d]$, automated physiological loop closure requires domain-specific calibration in external Adapters.
3. **One-Sided Deniability vs. Two-Sided DP**: Deterministic OR-pooling ($z_d = x_{\text{sens},d} \lor x_{\text{pref},d}$) yields one-sided likelihood-ratio bound $\ln(1/p_{\text{pref}})$ for $z_d = 1$ (composing as $k\ln(1/p_{\text{pref}})$), whereas $z_d = 0$ reveals $x_{\text{sens},d} = 0$. High-threat multi-epoch settings use symmetric randomized response (`randomizedResponseFlipProb` $q \in (0, 0.5)$, $\epsilon_{\text{dim}} = \ln((1-q)/q)$).

---

## 6. Reproducible Simulation Evaluation (Suite v4)

All benchmarks (`node simulations/benchmark.mjs`, `simulations/benchmark_results.json`) apply 4% per-epoch stress shocks ($+0.50$ to $L$), identical ambient noise (`0.08`), and explicit **$\kappa = 0.20$ interface-translation drag** on `INTERFACE_DECOUPLING`.

### 6.1 Experiment 1: Dyadic Coupling Budget Sweep via Boundary Envelopes ($N = 1,000$ dyads $\times 30$ epochs, $D = 5$, $\kappa = 0.20$)

| $\Pi_{\text{budget}}$ | Strategy | Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | COMP_DEL (%) | INTF_DEC (%) | EXIT_SORT (%) | LOAD_REL (%) |
| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 15 | `SCALAR_MIDPOINT` | 0.14% | 0.2022 | 0.21% | 0.00% | - | - | - | - |
| 15 | `PRAXEOPHYSICS` | **0.00%** | **0.0474** | 0.20% | **0.00%** | 10.82 | 88.73 | 0.05 | 0.4 |
| 30 | `SCALAR_MIDPOINT` | 1.34% | 0.3501 | 0.24% | 0.00% | - | - | - | - |
| 30 | `PRAXEOPHYSICS` | **0.01%** | **0.0737** | 0.20% | **0.00%** | 14.85 | 83.82 | 0.93 | 0.4 |
| 50 | `SCALAR_MIDPOINT` | 2.19% | 0.4696 | 0.34% | 0.01% | - | - | - | - |
| 50 | `PRAXEOPHYSICS` | **0.01%** | **0.0842** | 0.16% | **0.00%** | 18.39 | 79.7 | 1.58 | 0.33 |
| 100 | `SCALAR_MIDPOINT` | 2.83% | 0.6414 | 0.72% | 0.28% | - | - | - | - |
| 100 | `PRAXEOPHYSICS` | **0.01%** | **0.0863** | 0.23% | **0.00%** | 19.38 | 78.39 | 1.77 | 0.46 |

### 6.2 Experiment 2: Multi-Scale Pool Cohort Sorting ($M = 20$ Constrained Pools $\times 25$ & $M = 100$ Large Pools $\times 10$, $D = 4$, $\Pi_{\text{budget}} = 80$, $30$ epochs, $\kappa = 0.20$)

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

### 6.3 Experiment 3: Epistemic Exploration & Information Gain under EFE $G(\pi)$ ($N = 500$ dyads $\times 30$ epochs, $D = 5$, $\Pi_{\text{budget}} = 100$, $\kappa = 0.20$)

| Strategy | Mean Epistemic Gain (nats) | Frontier Exploration (%) | Dark-Room Retreat (%) | Guardrail Violation (%) |
| :--- | ---: | ---: | ---: | ---: |
| `SCALAR_MIDPOINT` | 0.4250 | 71.21% | 12.44% | 3.88% |
| `PRAXEOPHYSICS` | **0.4963** | **76.26%** | 0.22% | **0.02%** |

### 6.4 Experiment 4: Epoch Learning Hyperparameter Sensitivity ($N = 500$ dyads $\times 30$ epochs, $D = 5$, $\Pi_{\text{budget}} = 80$, $\kappa = 0.20$)

| $\lambda$ (Decay) | $\alpha$ (Gain) | Violation (%) | Mean VFE | Terminal Cap ($1-L$) |
| ---: | ---: | ---: | ---: | ---: |
| 0.50 | 0.10 | 0.01% | 0.0855 | 0.9934 |
| 0.70 | 0.15 | 0.01% | 0.0854 | 0.9755 |
| 0.85 | 0.25 | 0.02% | 0.0858 | 0.9601 |


### 6.5 Experiment 5: Cross-Domain Killer Use-Case Benchmarks (Domains 1–4)

#### 5A. Silent Hospitality, Salon, Mobility & Retail Alignment ($N = 1,000$ sessions, $D = 4$, $p_{\text{sens}}=0.15, p_{\text{pref}}=0.40$)
| Strategy | Silent Churn / Violation (%) | Mean VFE | Bayesian Attribution Risk (%) |
| :--- | ---: | ---: | ---: |
| `POLITE_SILENCE_TATEMAE` | 74.10% | 2.9526 | 0.00% |
| `VERBAL_CONFESSION` | 0.00% | 0.0101 | 100.00% |
| `PRAXEOPHYSICS_DENIABLE_ENVELOPE` | 0.00% | 0.0102 | 30.61% |

#### 5B. Group Dining & Travel Coordination — Breaking the Polite-Silence (*Tatemae*) Deadlock ($N = 500$ groups of $4$, $D = 4$)
| Strategy | Group Success Rate (%) | Hidden Violation Group (%) | Mean Member VFE | Bayesian Attribution Risk (%) |
| :--- | ---: | ---: | ---: | ---: |
| `GROUP_CHAT_TATEMAE` | 0.00% | 100.00% | 3.9720 | 0.00% |
| `RAW_GROUP_CONFESSION` | 100.00% | 0.00% | 0.8179 | 100.00% |
| `PRAXEOPHYSICS_ENVELOPE_INTERSECTION` | 100.00% | 0.00% | 0.8179 | 30.61% |

#### 5C. Dating, Marriage & Co-Living Relational Topology ($25$ pools $\times 40$ agents, $D = 6$)
| Strategy | Co-Living Breakup / Violation (%) | Mean Pair VFE | Reciprocal Duality (%) | Modular Parallelism (%) |
| :--- | ---: | ---: | ---: | ---: |
| `DATING_APP_1D_HOBBY` | 26.80% | 0.6225 | 0.00% | 0.00% |
| `HOMOGENEITY_6D_MIDPOINT` | 9.00% | 0.3092 | 0.00% | 0.00% |
| `PRAXEOPHYSICS_RELATIONAL_TOPOLOGY` | 0.00% | 0.0491 | 20.00% | 80.00% |

#### 5D. Bilateral Freelance / ADR Contract Settlement under Exogenous $p_{\text{ref}} \sim \mathcal{U}(0.35, 0.65)$ ($N = 1,000$ viable deals)
| Strategy | Deal Settlement Rate (%) | Strategic Bluff Incentive (%) | Reservation Exposure (%) |
| :--- | ---: | ---: | ---: |
| `SPLIT_DIFFERENCE_BLUFFING` | 67.60% | 100.00% | 100.00% |
| `PLAIN_MEDIATOR_ESCROW` | 75.00% | 0.00% | 100.00% |
| `PRAXEOPHYSICS_POSTED_REFERENCE_ZKP` | 75.00% | 0.00% | 0.00% |
---

## 7. Prior IP Continuity & Licensing

This release (`v4.2.0`) is a direct mathematical formalization and reference implementation of the pre-existing intellectual property baseline finalized and timestamped **2026-08-31** (*Praxeophysics Protocol Baseline Specification v4.0.0*), developed independently by the founder (Lead Praxeophysicist) on personal equipment without the use of any employer or third-party confidential information, non-public intellectual property, or organizational funding. Specifications/monographs are licensed under **CC BY 4.0 International**, and source code/schemas under **Apache License 2.0**.

---

## References

1. Ashby, W. R. (1956). *An Introduction to Cybernetics*. Chapman & Hall. http://pcp.vub.ac.be/books/IntroCyb.pdf
2. Bateson, G. (1972). *Steps to an Ecology of Mind*. University of Chicago Press. https://press.uchicago.edu/ucp/books/book/chicago/S/bo3620295.html
3. Coase, R. H. (1960). The Problem of Social Cost. *The Journal of Law and Economics*, 3, 1–44. https://doi.org/10.1086/466560
4. Deane, G., Miller, M., & Wilkinson, S. (2020). Losing Ourselves: Active Inference, Depersonalization, and Meditation. *Frontiers in Psychology*, 11, 539726. https://doi.org/10.3389/fpsyg.2020.539726
5. Dwork, C. (2006). Differential Privacy. *ICALP 2006*, LNCS 4052, 1–12. https://doi.org/10.1007/11787006_1
6. Friston, K. J., Thornton, C., & Clark, A. (2012). Free-Energy Minimization and the Dark-Room Problem. *Frontiers in Psychology*, 3, 130. https://doi.org/10.3389/fpsyg.2012.00130
7. Friston, K. J. (2019). A free energy principle for a particular physics. *arXiv:1906.10184*. https://doi.org/10.48550/arXiv.1906.10184
8. Goldwasser, S., Micali, S., & Rackoff, C. (1989). The Knowledge Complexity of Interactive Proof Systems. *SIAM Journal on Computing*, 18(1), 186–208. https://doi.org/10.1137/0218012
9. Hagerty, K. M., & Rogerson, W. P. (1987). Robust Trading Mechanisms. *Journal of Economic Theory*, 42(1), 94–107. https://doi.org/10.1016/0022-0531(87)90104-9
10. Hayek, F. A. (1945). The Use of Knowledge in Society. *The American Economic Review*, 35(4), 519–530. https://www.jstor.org/stable/1809376
11. Helly, E. (1923). Über Mengen konvexer Körper mit gemeinschaftlichen Punkten. *Jahresbericht der Deutschen Mathematiker-Vereinigung*, 32, 175–176. https://eudml.org/doc/145660
12. Hirschman, A. O. (1970). *Exit, Voice, and Loyalty: Responses to Decline in Firms, Organizations, and States*. Harvard University Press. https://archive.org/details/exitvoiceloyalty0000hirs
13. Komendarczyk, R., Block, W. E., Levendis, J., & Tipler, F. J. (2026). A Formalization of Austrian Economics. Praxeological Foundations. *arXiv:2606.18292*. https://doi.org/10.48550/arXiv.2606.18292
14. Laukkonen, R. E., Friston, K. J., & Chandaria, S. (2025). A beautiful loop: An active inference theory of consciousness. *Neuroscience & Biobehavioral Reviews*, 176, 106296. https://doi.org/10.1016/j.neubiorev.2025.106296
15. McEwen, B. S. (1998). Stress, Adaptation, and Disease: Allostasis and Allostatic Load. *Annals of the New York Academy of Sciences*, 840(1), 33–44. https://doi.org/10.1111/j.1749-6632.1998.tb09546.x
16. Mises, L. von (1949/1998). *Human Action: A Treatise on Economics*. Mises Institute. https://mises.org/library/book/human-action
17. Myerson, R. B., & Satterthwaite, M. A. (1983). Efficient Mechanisms for Bilateral Trading. *Journal of Economic Theory*, 29(2), 265–281. https://doi.org/10.1016/0022-0531(83)90048-0
18. Olson, M. (1993). Dictatorship, Democracy, and Development. *American Political Science Review*, 87(3), 567–576. https://doi.org/10.2307/2938736
19. Ostrom, E. (2010a). Beyond Markets and States: Polycentric Governance of Complex Economic Systems. *American Economic Review*, 100(3), 641–672. https://doi.org/10.1257/aer.100.3.641
20. Ostrom, E. (2010b). Polycentric systems for coping with collective action and global environmental change. *Global Environmental Change*, 20(4), 550–557. https://doi.org/10.1016/j.gloenvcha.2010.07.004
21. Parr, T., Da Costa, L., & Friston, K. J. (2020). Markov blankets, information geometry and stochastic thermodynamics. *Phil. Trans. R. Soc. A*, 378, 20190159. https://doi.org/10.1098/rsta.2019.0159
22. Polanyi, M. (1966). *The Tacit Dimension*. Doubleday / University of Chicago Press. https://archive.org/details/tacitdimension00pola
23. Rothbard, M. N. (1956/2011). Toward a Reconstruction of Utility and Welfare Economics. *Economic Controversies*. https://mises.org/library/book/economic-controversies
24. Simon, H. A. (1962). The Architecture of Complexity. *Proceedings of the American Philosophical Society*, 106(6), 467–482. https://www.jstor.org/stable/985254
25. Tillemans, T. (2021). Dharmakīrti. *Stanford Encyclopedia of Philosophy*. https://plato.stanford.edu/entries/dharmakiirti/
26. Vasil, J., et al. (2020). A World Unto Itself: Human Communication as Active Inference. *Frontiers in Psychology*, 11, 417. https://doi.org/10.3389/fpsyg.2020.00417
27. W3C Recommendation (2025). *Verifiable Credentials Data Model v2.0*. https://www.w3.org/TR/vc-data-model-2.0/
28. Westerhoff, J. C. (2024). Nāgārjuna. *Stanford Encyclopedia of Philosophy*. https://plato.stanford.edu/entries/nagarjuna/
