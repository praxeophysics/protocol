# Praxeophysics Simulation Benchmarks (Reproducible Suite v4 — Boundary-Envelope Calculus & Epistemic EFE)

## Experiment 1: Dyadic Coupling Budget Sweep via Boundary Envelopes (N = 1,000 dyads × 30 epochs, D = 5, κ = 0.20)

| Π_budget | Strategy | Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | COMP_DEL (%) | INTF_DEC (%) | EXIT_SORT (%) | LOAD_REL (%) |
| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 15 | SCALAR_MIDPOINT | 0.14% | 0.2022 | 0.21% | 0.00% | - | - | - | - |
| 15 | PRAXEOPHYSICS | 0.00% | 0.0474 | 0.20% | 0.00% | 10.82 | 88.73 | 0.05 | 0.4 |
| 30 | SCALAR_MIDPOINT | 1.34% | 0.3501 | 0.24% | 0.00% | - | - | - | - |
| 30 | PRAXEOPHYSICS | 0.01% | 0.0737 | 0.20% | 0.00% | 14.85 | 83.82 | 0.93 | 0.4 |
| 50 | SCALAR_MIDPOINT | 2.19% | 0.4696 | 0.34% | 0.01% | - | - | - | - |
| 50 | PRAXEOPHYSICS | 0.01% | 0.0842 | 0.16% | 0.00% | 18.39 | 79.7 | 1.58 | 0.33 |
| 100 | SCALAR_MIDPOINT | 2.83% | 0.6414 | 0.72% | 0.28% | - | - | - | - |
| 100 | PRAXEOPHYSICS | 0.01% | 0.0863 | 0.23% | 0.00% | 19.38 | 78.39 | 1.77 | 0.46 |

## Experiment 2: Multi-Scale Pool Cohort Sorting (M = 20 Constrained Pools & M = 100 Large Pools, D = 4, Π_budget = 80, κ = 0.20)

| Pool Size M | Strategy | Active Cohort (%) | Mean Size | Load Relief (%) | Solo Niche (%) | Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | Terminal Cap (1-L) |
| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 | SCALAR_NEAREST_K2 | 100.00% | 2.00 | 0.00% | 0.00% | 0.70% | 0.1623 | 0.17% | 0.03% | 0.9709 |
| 20 | SCALAR_WEIGHTED_K2 | 100.00% | 2.00 | 0.00% | 0.00% | 0.01% | 0.0578 | 0.24% | 0.00% | 0.9838 |
| 20 | PRAXEOPHYSICS_COHORT_K2 | 99.68% | 2.00 | 0.16% | 0.16% | 0.00% | 0.0189 | 0.16% | 0.00% | 0.9804 |
| 20 | PRAXEOPHYSICS_COHORT_K4 | 99.81% | 3.99 | 0.17% | 0.02% | 0.00% | 0.0331 | 0.17% | 0.00% | 0.9798 |
| 100 | SCALAR_NEAREST_K2 | 100.00% | 2.00 | 0.00% | 0.00% | 0.14% | 0.0621 | 0.18% | 0.00% | 0.9728 |
| 100 | SCALAR_WEIGHTED_K2 | 100.00% | 2.00 | 0.00% | 0.00% | 0.13% | 0.0463 | 0.30% | 0.09% | 0.9736 |
| 100 | PRAXEOPHYSICS_COHORT_K2 | 99.70% | 2.00 | 0.16% | 0.14% | 0.00% | 0.0107 | 0.16% | 0.00% | 0.9805 |
| 100 | PRAXEOPHYSICS_COHORT_K4 | 99.78% | 3.99 | 0.22% | 0.00% | 0.00% | 0.0192 | 0.22% | 0.00% | 0.9793 |

## Experiment 3: Epistemic Exploration & Information Gain under EFE G(π) (N = 500 dyads × 30 epochs, D = 5, Π_budget = 100, κ = 0.20)

| Strategy | Mean Epistemic Gain (nats) | Frontier Exploration (%) | Dark-Room Retreat (%) | Guardrail Violation (%) |
| :--- | ---: | ---: | ---: | ---: |
| SCALAR_MIDPOINT | 0.4250 | 71.21% | 12.44% | 3.88% |
| PRAXEOPHYSICS | 0.4963 | 76.26% | 0.22% | 0.02% |

## Experiment 4: Epoch Learning Hyperparameter Sensitivity (N = 500 dyads × 30 epochs, D = 5, Π_budget = 80, κ = 0.20)

| λ (Decay) | α (Gain) | Violation (%) | Mean VFE | Terminal Cap (1-L) |
| ---: | ---: | ---: | ---: | ---: |
| 0.50 | 0.10 | 0.01% | 0.0855 | 0.9934 |
| 0.70 | 0.15 | 0.01% | 0.0854 | 0.9755 |
| 0.85 | 0.25 | 0.02% | 0.0858 | 0.9601 |

## Experiment 5: Cross-Domain Killer Use-Case Benchmarks (Hospitality/Retail, Group Dining, Dating/Co-Living, Bilateral ADR)

### 5A. Silent Hospitality, Salon, Mobility & Retail Alignment (N = 1,000 sessions, D = 4)
| Strategy | Silent Churn / Violation (%) | Mean VFE | Bayesian Attribution Risk (%) |
| :--- | ---: | ---: | ---: |
| POLITE_SILENCE_TATEMAE | 74.10% | 2.9526 | 0.00% |
| VERBAL_CONFESSION | 0.00% | 0.0101 | 100.00% |
| PRAXEOPHYSICS_DENIABLE_ENVELOPE | 0.00% | 0.0102 | 30.61% |

### 5B. Group Dining & Travel Coordination — Breaking the Tatemae Deadlock (N = 500 groups of 4, D = 4)
| Strategy | Group Success Rate (%) | Hidden Violation Group (%) | Mean Member VFE | Bayesian Attribution Risk (%) |
| :--- | ---: | ---: | ---: | ---: |
| GROUP_CHAT_TATEMAE | 0.00% | 100.00% | 3.9720 | 0.00% |
| RAW_GROUP_CONFESSION | 100.00% | 0.00% | 0.8179 | 100.00% |
| PRAXEOPHYSICS_ENVELOPE_INTERSECTION | 100.00% | 0.00% | 0.8179 | 30.61% |

### 5C. Dating, Marriage & Co-Living Relational Topology (25 pools × 40 agents, D = 6)
| Strategy | Co-Living Breakup / Violation (%) | Mean Pair VFE | Reciprocal Duality (%) | Modular Parallelism (%) |
| :--- | ---: | ---: | ---: | ---: |
| DATING_APP_1D_HOBBY | 26.80% | 0.6225 | 0.00% | 0.00% |
| HOMOGENEITY_6D_MIDPOINT | 9.00% | 0.3092 | 0.00% | 0.00% |
| PRAXEOPHYSICS_RELATIONAL_TOPOLOGY | 0.00% | 0.0491 | 20.00% | 80.00% |

### 5D. Bilateral Freelance / ADR Contract Settlement (N = 1,000 viable deals)
| Strategy | Deal Settlement Rate (%) | Strategic Bluff Incentive (%) | Reservation Exposure (%) |
| :--- | ---: | ---: | ---: |
| SPLIT_DIFFERENCE_BLUFFING | 67.60% | 100.00% | 100.00% |
| PLAIN_MEDIATOR_ESCROW | 75.00% | 0.00% | 100.00% |
| PRAXEOPHYSICS_POSTED_REFERENCE_ZKP | 75.00% | 0.00% | 0.00% |
