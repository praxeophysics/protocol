# Praxeophysics Protocol v4.2.0

**Dynamic Boundary Generative Model & Reference Architecture for Non-Price Mutual Reconciliation (*Synallactics*)**

Maintained by the **Praxeophysics Institute** | Author: **Praxeophysics Institute** ([Inquiries](https://forms.gle/GxFCbK4oic87dJVA8)) | Portal: `https://praxeophysics.org`

---

## Repository Contents

* **Technical Paper**: [`PAPER.md`](./PAPER.md) (formal math, Silver-Ratio threshold, threat model, explicit limitations, and Suite v4 benchmarks)
* **Specifications & Glossary**: [`SPECIFICATION.md`](./SPECIFICATION.md) | [`GLOSSARY.md`](./GLOSSARY.md) | [`BREAKTHROUGHS.md`](./BREAKTHROUGHS.md)
* **Canonical Index & Japanese Editions**: [`docs/`](./docs/)
* **Reference TypeScript Engine**: [`src/reference_engine.ts`](./src/reference_engine.ts)
* **JSON-LD & JSON Schemas**: [`schemas/`](./schemas/) (`boundary-claim.v4.2.jsonld`, Draft 2020-12 Claim & A2A Handshake Schemas)
* **Automated Test Suite**: [`tests/praxeophysics-core.test.mjs`](./tests/praxeophysics-core.test.mjs) (12 unit, schema, envelope-opacity, EFE exploration, and 1,000-pair property tests)
* **Simulation Benchmarks**: [`simulations/benchmark.mjs`](./simulations/benchmark.mjs) & [`simulations/benchmark_report.md`](./simulations/benchmark_report.md)

## Quick Verification

```bash
npm install
npm test
npm run benchmark
```

## Threat Model & Maturity Scope

`v4.2.0` represents a **Formal Decision Model and Draft Reference Architecture**:
* **Precision vs. Mean Manipulation**: Finite budget normalization and UNSAT exclusion deter $\Pi_d$ inflation when $\Pi_{\text{budget}} \ge 50\text{–}100$, whereas multi-agent `reconcileCoupling` assumes cooperative or sensor-attested $\mu_d$ commitments. Strict DSIC applies to exogenous-reference ZKP settlement (`evaluateStrategyProofSettlement`).
* **Privacy Accounting**: Deterministic OR-pooling guarantees one-sided likelihood-ratio deniability $\ln(1/p_{\text{pref}})$ for positive flags ($z_d=1$), with an optional symmetric randomized-response mode (`randomizedResponseFlipProb`) for two-sided $(\epsilon, 0)$-DP.
* **ZKP Backends**: Zero-knowledge circuit backends (e.g., zk-SNARK / Circom verifiers) remain pluggable beneath the JSON Schema layer.

## Prior IP Continuity & Licensing

* **Paper, Specifications & Documentation**: [CC BY 4.0 International](https://creativecommons.org/licenses/by/4.0/)
* **Source Code, Tests & Schemas**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
* **Prior IP Continuity**: Direct mathematical formalization and reference implementation of the pre-existing baseline finalized and timestamped **2026-08-31** (*Praxeophysics Protocol Baseline Specification v4.0.0*). See [`CITATION.cff`](./CITATION.cff) and [`.zenodo.json`](./.zenodo.json).
