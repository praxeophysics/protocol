import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PraxeophysicsBlanketEngine,
  MultiBlanketReconciliationAdapter,
  normalizePrecisionBudget,
} from '../dist/reference_engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createRng(seed = 20261115) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeAgentState(dims, piBudget, rng) {
  const mu = Array.from({ length: dims }, () => rng());
  const rawPi = Array.from({ length: dims }, () => Math.pow(rng() + 0.08, -1.5));
  const Pi = normalizePrecisionBudget(rawPi, piBudget);
  const L_load = 0.05 + rng() * 0.25;
  return { mu, Pi, L_load };
}

function cloneState(s) {
  return { mu: s.mu.slice(), Pi: s.Pi.slice(), L_load: s.L_load };
}

function jitter(val, scale, rng) {
  return val + (rng() - 0.5) * scale;
}

// Experiment 1: Dyadic Coupling Budget Sweep (N = 1,000 dyads x 30 epochs, D = 5, kappa = 0.20)
function runDyadicSensitivity(piBudget, kappa = 0.20, numPairs = 1000, dims = 5, epochs = 30) {
  const genRng = createRng(20261115);
  const pairs = Array.from({ length: numPairs }, () => ({
    a: makeAgentState(dims, piBudget, genRng),
    b: makeAgentState(dims, piBudget, genRng),
  }));

  const evalStrategy = (mode) => {
    const rng = createRng(70000 + piBudget + mode.length);
    const localPairs = pairs.map(p => ({ a: cloneState(p.a), b: cloneState(p.b) }));
    let totalInt = 0, violations = 0, totalVfe = 0, preOverloads = 0, postOverloads = 0;
    const directives = { COMPLEMENTARY_DELEGATION: 0, INTERFACE_DECOUPLING: 0, FRICTIONLESS_EXIT_SORTING: 0, ALLOSTATIC_LOAD_RELIEF: 0 };

    for (let t = 0; t < epochs; t++) {
      for (const p of localPairs) {
        if (rng() < 0.04) p.a.L_load = Math.min(0.92, p.a.L_load + 0.50);
        if (rng() < 0.04) p.b.L_load = Math.min(0.92, p.b.L_load + 0.50);
        if (p.a.L_load >= 0.75) preOverloads += 1;
        if (p.b.L_load >= 0.75) preOverloads += 1;

        let obsA, obsB;
        if (mode === 'SCALAR_MIDPOINT') {
          const mid = p.a.mu.map((m, d) => jitter(0.5 * (m + p.b.mu[d]), 0.08, rng));
          obsA = mid;
          obsB = mid;
        } else {
          const envA = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(p.a, piBudget, 0.75);
          const envB = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(p.b, piBudget, 0.75);
          const rec = MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA, envB);
          directives[rec.directive] += 1;
          if (rec.directive === 'ALLOSTATIC_LOAD_RELIEF') {
            obsA = p.a.mu.map(m => jitter(m, 0.08, rng));
            obsB = p.b.mu.map(m => jitter(m, 0.08, rng));
          } else if (rec.directive === 'FRICTIONLESS_EXIT_SORTING') {
            obsA = p.a.mu.map(m => jitter(m, 0.08, rng));
            obsB = p.b.mu.map(m => jitter(m, 0.08, rng));
          } else {
            obsA = [];
            obsB = [];
            for (let d = 0; d < dims; d++) {
              if (rec.dimension_directives[d] === 'COMPLEMENTARY_DELEGATION') {
                const u = jitter(rec.optimal_joint_state[d], 0.08, rng);
                obsA.push(u);
                obsB.push(u);
              } else {
                obsA.push(jitter(p.a.mu[d] + kappa * (p.b.mu[d] - p.a.mu[d]), 0.08, rng));
                obsB.push(jitter(p.b.mu[d] + kappa * (p.a.mu[d] - p.b.mu[d]), 0.08, rng));
              }
            }
          }
        }

        const eA = PraxeophysicsBlanketEngine.evaluateAlignment(p.a, obsA, [], 0, 1.0, 0.75, piBudget);
        const eB = PraxeophysicsBlanketEngine.evaluateAlignment(p.b, obsB, [], 0, 1.0, 0.75, piBudget);
        totalVfe += eA.instant_total_vfe + eB.instant_total_vfe;
        for (let d = 0; d < dims; d++) {
          if (!eA.atomic_predicates[d]) violations += 1;
          if (!eB.atomic_predicates[d]) violations += 1;
          totalInt += 2;
        }
        p.a = PraxeophysicsBlanketEngine.stepEpochLearning(p.a, obsA, { piBudget }).next_state;
        p.b = PraxeophysicsBlanketEngine.stepEpochLearning(p.b, obsB, { piBudget }).next_state;
        if (p.a.L_load >= 0.75) postOverloads += 1;
        if (p.b.L_load >= 0.75) postOverloads += 1;
      }
    }

    const totA = numPairs * 2 * epochs, totP = numPairs * epochs;
    return {
      piBudget, mode,
      violation_pct: Number(((violations / totalInt) * 100).toFixed(2)),
      mean_vfe: Number((totalVfe / totA).toFixed(4)),
      pre_overload_pct: Number(((preOverloads / totA) * 100).toFixed(2)),
      post_overload_pct: Number(((postOverloads / totA) * 100).toFixed(2)),
      directives_pct: mode === 'PRAXEOPHYSICS' ? Object.fromEntries(Object.entries(directives).map(([k, v]) => [k, Number(((v / totP) * 100).toFixed(2))])) : null,
    };
  };
  return [evalStrategy('SCALAR_MIDPOINT'), evalStrategy('PRAXEOPHYSICS')];
}

// Experiment 2: Pool Scale Sweep (M = 20 Constrained Pools & M = 100 Large Pools, D = 4, Pi_budget = 80, kappa = 0.20)
// Identical ambient noise scale (0.08) across all active modes so comparisons are strictly fair
function runPoolMatching(numPools = 10, poolSize = 100, dims = 4, piBudget = 80, epochs = 30, kappa = 0.20) {
  const genRng = createRng(88888 + poolSize);
  const pools = Array.from({ length: numPools }, (_, pIdx) =>
    Array.from({ length: poolSize }, (_, aIdx) => ({ id: `P${pIdx}_A${aIdx}`, state: makeAgentState(dims, piBudget, genRng) }))
  );

  const runMode = (mode, maxCohortSize = 2) => {
    const rng = createRng(100 + poolSize + mode.length * 17 + maxCohortSize);
    const localPools = pools.map(pool => pool.map(a => ({ id: a.id, state: cloneState(a.state) })));
    let totalInt = 0, violations = 0, totalVfe = 0, preOverloads = 0, postOverloads = 0;
    let activeEpochs = 0, reliefEpochs = 0, soloEpochs = 0, totalEpochs = 0, cohortSum = 0, cohortCnt = 0;

    for (let t = 0; t < epochs; t++) {
      for (const pool of localPools) {
        for (const a of pool) {
          if (rng() < 0.04) a.state.L_load = Math.min(0.92, a.state.L_load + 0.50);
          if (a.state.L_load >= 0.75) preOverloads += 1;
        }

        if (mode === 'SCALAR_NEAREST_K2' || mode === 'SCALAR_WEIGHTED_K2') {
          const used = new Set();
          for (let i = 0; i < pool.length; i++) {
            if (used.has(i)) continue;
            let bestJ = -1, bestCost = Infinity;
            for (let j = i + 1; j < pool.length; j++) {
              if (used.has(j)) continue;
              let cost = 0;
              for (let d = 0; d < dims; d++) {
                const dm = pool[i].state.mu[d] - pool[j].state.mu[d];
                if (mode === 'SCALAR_NEAREST_K2') {
                  cost += Math.abs(dm);
                } else {
                  const p1 = pool[i].state.Pi[d], p2 = pool[j].state.Pi[d];
                  cost += 0.5 * ((p1 * p2) / (p1 + p2)) * dm * dm;
                }
              }
              if (cost < bestCost) { bestCost = cost; bestJ = j; }
            }
            used.add(i); used.add(bestJ);
            const a = pool[i], b = pool[bestJ];
            cohortCnt += 1; cohortSum += 2;
            const uVec = a.state.mu.map((m, d) => {
              if (mode === 'SCALAR_NEAREST_K2') return jitter(0.5 * (m + b.state.mu[d]), 0.08, rng);
              const p1 = a.state.Pi[d], p2 = b.state.Pi[d];
              return jitter((p1 * m + p2 * b.state.mu[d]) / (p1 + p2), 0.08, rng);
            });
            for (const ag of [a, b]) {
              const ev = PraxeophysicsBlanketEngine.evaluateAlignment(ag.state, uVec, [], 0, 1.0, 0.75, piBudget);
              totalVfe += ev.instant_total_vfe;
              for (let d = 0; d < dims; d++) { if (!ev.atomic_predicates[d]) violations += 1; totalInt += 1; }
              ag.state = PraxeophysicsBlanketEngine.stepEpochLearning(ag.state, uVec, { piBudget }).next_state;
              if (ag.state.L_load >= 0.75) postOverloads += 1;
              activeEpochs += 1; totalEpochs += 1;
            }
          }
        } else {
          const sorted = MultiBlanketReconciliationAdapter.sortCompatibleCohorts(pool, 0.75, piBudget, maxCohortSize);
          const byId = new Map(pool.map(a => [a.id, a]));
          for (const id of sorted.load_relief_agent_ids) {
            const ag = byId.get(id);
            const obs = ag.state.mu.map(m => jitter(m, 0.08, rng));
            const ev = PraxeophysicsBlanketEngine.evaluateAlignment(ag.state, obs, [], 0, 1.0, 0.75, piBudget);
            totalVfe += ev.instant_total_vfe;
            for (let d = 0; d < dims; d++) { if (!ev.atomic_predicates[d]) violations += 1; totalInt += 1; }
            ag.state = PraxeophysicsBlanketEngine.stepEpochLearning(ag.state, obs, { piBudget }).next_state;
            if (ag.state.L_load >= 0.75) postOverloads += 1;
            reliefEpochs += 1; totalEpochs += 1;
          }
          for (const cohort of sorted.cohorts) {
            if (cohort.length === 1) {
              const ag = byId.get(cohort[0]);
              const obs = ag.state.mu.map(m => jitter(m, 0.08, rng));
              const ev = PraxeophysicsBlanketEngine.evaluateAlignment(ag.state, obs, [], 0, 1.0, 0.75, piBudget);
              totalVfe += ev.instant_total_vfe;
              for (let d = 0; d < dims; d++) { if (!ev.atomic_predicates[d]) violations += 1; totalInt += 1; }
              ag.state = PraxeophysicsBlanketEngine.stepEpochLearning(ag.state, obs, { piBudget }).next_state;
              if (ag.state.L_load >= 0.75) postOverloads += 1;
              soloEpochs += 1; totalEpochs += 1;
              continue;
            }
            cohortCnt += 1; cohortSum += cohort.length;
            const members = cohort.map(id => byId.get(id));
            const target = [], decoupled = [], muMeans = [];
            for (let d = 0; d < dims; d++) {
              let num = 0, den = 0, muSum = 0, lo = -Infinity, hi = Infinity;
              for (const ag of members) {
                const pi = ag.state.Pi[d], mu = ag.state.mu[d];
                const r = Math.sqrt((2 * (1 - ag.state.L_load)) / pi);
                num += pi * mu; den += pi; muSum += mu;
                lo = Math.max(lo, mu - r); hi = Math.min(hi, mu + r);
              }
              const clamped = Math.min(hi, Math.max(lo, num / den));
              const muMean = muSum / members.length;
              let fStar = 0, fMid = 0;
              for (const ag of members) {
                fStar += 0.5 * ag.state.Pi[d] * Math.pow(clamped - ag.state.mu[d], 2);
                fMid += 0.5 * ag.state.Pi[d] * Math.pow(muMean - ag.state.mu[d], 2);
              }
              target.push(clamped);
              muMeans.push(muMean);
              decoupled.push(Math.max(0, fMid - fStar) <= fStar);
            }
            for (const ag of members) {
              const obs = target.map((u, d) =>
                decoupled[d] ? jitter(ag.state.mu[d] + kappa * (muMeans[d] - ag.state.mu[d]), 0.08, rng) : jitter(u, 0.08, rng)
              );
              const ev = PraxeophysicsBlanketEngine.evaluateAlignment(ag.state, obs, [], 0, 1.0, 0.75, piBudget);
              totalVfe += ev.instant_total_vfe;
              for (let d = 0; d < dims; d++) { if (!ev.atomic_predicates[d]) violations += 1; totalInt += 1; }
              ag.state = PraxeophysicsBlanketEngine.stepEpochLearning(ag.state, obs, { piBudget }).next_state;
              if (ag.state.L_load >= 0.75) postOverloads += 1;
              activeEpochs += 1; totalEpochs += 1;
            }
          }
        }
      }
    }
    const termCap = localPools.flat().reduce((acc, a) => acc + (1.0 - a.state.L_load), 0) / (numPools * poolSize);
    return {
      poolSize,
      mode,
      active_cohort_rate_pct: Number(((activeEpochs / totalEpochs) * 100).toFixed(2)),
      mean_cohort_size: Number((cohortSum / Math.max(1, cohortCnt)).toFixed(2)),
      load_relief_rate_pct: Number(((reliefEpochs / totalEpochs) * 100).toFixed(2)),
      solo_niche_rate_pct: Number(((soloEpochs / totalEpochs) * 100).toFixed(2)),
      violation_pct: Number(((violations / totalInt) * 100).toFixed(2)),
      mean_vfe: Number((totalVfe / totalEpochs).toFixed(4)),
      pre_overload_pct: Number(((preOverloads / totalEpochs) * 100).toFixed(2)),
      post_overload_pct: Number(((postOverloads / totalEpochs) * 100).toFixed(2)),
      mean_terminal_capacity: Number(termCap.toFixed(4)),
    };
  };

  return [
    runMode('SCALAR_NEAREST_K2', 2),
    runMode('SCALAR_WEIGHTED_K2', 2),
    runMode('PRAXEOPHYSICS_COHORT_K2', 2),
    runMode('PRAXEOPHYSICS_COHORT_K4', 4),
  ];
}

// Experiment 3: Epistemic Exploration & Information Gain under EFE G(pi) (Prop 3.200-3.210)
function runEpistemicExplorationBenchmark(numPairs = 500, dims = 5, piBudget = 100, epochs = 30, kappa = 0.20) {
  const genRng = createRng(314159);
  const pairs = Array.from({ length: numPairs }, () => ({
    a: makeAgentState(dims, piBudget, genRng),
    b: makeAgentState(dims, piBudget, genRng),
  }));

  const evalExploration = (mode) => {
    const rng = createRng(90000 + mode.length * 31);
    const localPairs = pairs.map(p => ({ a: cloneState(p.a), b: cloneState(p.b) }));
    let totalEpistemicGain = 0, frontierSelections = 0, darkRoomSelections = 0, totalDecisions = 0, violations = 0, totalInt = 0;

    for (let t = 0; t < epochs; t++) {
      for (const p of localPairs) {
        if (rng() < 0.04) p.a.L_load = Math.min(0.92, p.a.L_load + 0.50);
        if (rng() < 0.04) p.b.L_load = Math.min(0.92, p.b.L_load + 0.50);

        let obsA, obsB;
        if (mode === 'SCALAR_MIDPOINT') {
          const mid = p.a.mu.map((m, d) => jitter(0.5 * (m + p.b.mu[d]), 0.08, rng));
          obsA = mid; obsB = mid;
        } else {
          const envA = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(p.a, piBudget, 0.75);
          const envB = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(p.b, piBudget, 0.75);
          const rec = MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA, envB);
          if (rec.directive === 'ALLOSTATIC_LOAD_RELIEF' || rec.directive === 'FRICTIONLESS_EXIT_SORTING') {
            obsA = p.a.mu.map(m => jitter(m, 0.08, rng));
            obsB = p.b.mu.map(m => jitter(m, 0.08, rng));
          } else {
            obsA = []; obsB = [];
            for (let d = 0; d < dims; d++) {
              if (rec.dimension_directives[d] === 'COMPLEMENTARY_DELEGATION') {
                const u = jitter(rec.optimal_joint_state[d], 0.08, rng);
                obsA.push(u); obsB.push(u);
              } else {
                obsA.push(jitter(p.a.mu[d] + kappa * (p.b.mu[d] - p.a.mu[d]), 0.08, rng));
                obsB.push(jitter(p.b.mu[d] + kappa * (p.a.mu[d] - p.b.mu[d]), 0.08, rng));
              }
            }
          }
        }

        const eA = PraxeophysicsBlanketEngine.evaluateAlignment(p.a, obsA, [], 0, 1.0, 0.75, piBudget);
        const eB = PraxeophysicsBlanketEngine.evaluateAlignment(p.b, obsB, [], 0, 1.0, 0.75, piBudget);
        for (let d = 0; d < dims; d++) {
          if (!eA.atomic_predicates[d]) violations += 1;
          if (!eB.atomic_predicates[d]) violations += 1;
          totalInt += 2;
        }
        p.a = PraxeophysicsBlanketEngine.stepEpochLearning(p.a, obsA, { piBudget, loadGainRate: 0.25, recoveryCredit: 0.04 }).next_state;
        p.b = PraxeophysicsBlanketEngine.stepEpochLearning(p.b, obsB, { piBudget, loadGainRate: 0.25, recoveryCredit: 0.04 }).next_state;

        for (const ag of [p.a, p.b]) {
          const policies = [
            { id: 'dark_room', expected_stimulus: ag.mu.slice(), exploration_variance: Array(dims).fill(0.001) },
            { id: 'local_probe', expected_stimulus: ag.mu.map(m => m + 0.03), exploration_variance: Array(dims).fill(0.025) },
            { id: 'frontier_explore', expected_stimulus: ag.mu.map(m => m + 0.05), exploration_variance: Array(dims).fill(0.065) },
          ];
          const efeRes = PraxeophysicsBlanketEngine.evaluateExpectedFreeEnergy(ag, policies, 1.2, 0.75, piBudget);
          totalDecisions += 1;
          totalEpistemicGain += efeRes.epistemic_value;
          if (efeRes.selected_policy_id === 'frontier_explore') frontierSelections += 1;
          if (efeRes.selected_policy_id === 'dark_room' || efeRes.selected_policy_id === null) darkRoomSelections += 1;
        }
      }
    }

    return {
      mode,
      mean_epistemic_gain_nats: Number((totalEpistemicGain / totalDecisions).toFixed(4)),
      frontier_exploration_pct: Number(((frontierSelections / totalDecisions) * 100).toFixed(2)),
      dark_room_retreat_pct: Number(((darkRoomSelections / totalDecisions) * 100).toFixed(2)),
      violation_pct: Number(((violations / totalInt) * 100).toFixed(2)),
    };
  };

  return [evalExploration('SCALAR_MIDPOINT'), evalExploration('PRAXEOPHYSICS')];
}

// Experiment 4: Epoch Learning Hyperparameter Sensitivity
function runHyperparameterSensitivity(kappa = 0.20) {
  const configs = [
    { loadDecayRate: 0.50, loadGainRate: 0.10 },
    { loadDecayRate: 0.70, loadGainRate: 0.15 },
    { loadDecayRate: 0.85, loadGainRate: 0.25 },
  ];
  const out = [];
  for (const cfg of configs) {
    const genRng = createRng(55555);
    const pairs = Array.from({ length: 500 }, () => ({ a: makeAgentState(5, 80, genRng), b: makeAgentState(5, 80, genRng) }));
    const rng = createRng(66666);
    let violations = 0, totalInt = 0, vfeSum = 0;
    for (let t = 0; t < 30; t++) {
      for (const p of pairs) {
        if (rng() < 0.04) p.a.L_load = Math.min(0.92, p.a.L_load + 0.50);
        if (rng() < 0.04) p.b.L_load = Math.min(0.92, p.b.L_load + 0.50);
        const envA = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(p.a, 80, 0.75);
        const envB = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(p.b, 80, 0.75);
        const rec = MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA, envB);
        const obsA = [], obsB = [];
        for (let d = 0; d < 5; d++) {
          if (rec.directive === 'ALLOSTATIC_LOAD_RELIEF' || rec.directive === 'FRICTIONLESS_EXIT_SORTING') {
            obsA.push(jitter(p.a.mu[d], 0.08, rng)); obsB.push(jitter(p.b.mu[d], 0.08, rng));
          } else if (rec.dimension_directives[d] === 'COMPLEMENTARY_DELEGATION') {
            const u = jitter(rec.optimal_joint_state[d], 0.08, rng); obsA.push(u); obsB.push(u);
          } else {
            obsA.push(jitter(p.a.mu[d] + kappa * (p.b.mu[d] - p.a.mu[d]), 0.08, rng));
            obsB.push(jitter(p.b.mu[d] + kappa * (p.a.mu[d] - p.b.mu[d]), 0.08, rng));
          }
        }
        const eA = PraxeophysicsBlanketEngine.evaluateAlignment(p.a, obsA, [], 0, 1.0, 0.75, 80);
        const eB = PraxeophysicsBlanketEngine.evaluateAlignment(p.b, obsB, [], 0, 1.0, 0.75, 80);
        vfeSum += eA.instant_total_vfe + eB.instant_total_vfe;
        for (let d = 0; d < 5; d++) { if (!eA.atomic_predicates[d]) violations += 1; if (!eB.atomic_predicates[d]) violations += 1; totalInt += 2; }
        p.a = PraxeophysicsBlanketEngine.stepEpochLearning(p.a, obsA, { ...cfg, piBudget: 80 }).next_state;
        p.b = PraxeophysicsBlanketEngine.stepEpochLearning(p.b, obsB, { ...cfg, piBudget: 80 }).next_state;
      }
    }
    const termCap = pairs.reduce((acc, p) => acc + (1 - p.a.L_load) + (1 - p.b.L_load), 0) / 1000;
    out.push({ lambda: cfg.loadDecayRate, alpha: cfg.loadGainRate, violation_pct: Number(((violations / totalInt) * 100).toFixed(2)), mean_vfe: Number((vfeSum / 30000).toFixed(4)), terminal_capacity: Number(termCap.toFixed(4)) });
  }
  return out;
}


// Experiment 5: Cross-Domain Killer Use-Case Benchmarks (Domains 1-4)
function runCrossDomainUseCases() {
  // Bayesian posterior attribution risk under OR-pooling: P(sens=1 | z=1) = p_sens / (p_sens + (1 - p_sens)*p_pref)
  const pSensPrior = 0.15;
  const pPrefPrior = 0.40;
  const bayesianPosteriorAttributionPct = Number(
    ((pSensPrior / (pSensPrior + (1 - pSensPrior) * pPrefPrior)) * 100).toFixed(2)
  ); // 30.61% (69.39% plausible deniability that request is an ordinary preference)

  // 5A: Silent Hospitality / Salon / Mobility / Retail Alignment (N = 1,000 sessions, D = 4)
  const rng5A = createRng(501001);
  const sessions = Array.from({ length: 1000 }, () => {
    const state = makeAgentState(4, 80, rng5A);
    const unspokenDim = Math.floor(rng5A() * 4);
    state.mu[unspokenDim] = rng5A() < 0.5 ? 0.12 : 0.88;
    const rawPi = state.Pi.slice();
    rawPi[unspokenDim] = 55;
    state.Pi = normalizePrecisionBudget(rawPi, 80);
    return state;
  });

  const eval5A = (mode) => {
    const r = createRng(501500 + mode.length);
    let silentChurnSessions = 0, totalVfe = 0, posteriorAttributionRisk = 0;
    for (const s of sessions) {
      let envSetting;
      if (mode === 'POLITE_SILENCE_TATEMAE') {
        envSetting = s.mu.map((m, d) => (s.Pi[d] > 25 && r() < 0.75) ? jitter(0.5, 0.10, r) : jitter(m, 0.08, r));
        posteriorAttributionRisk = 0;
      } else if (mode === 'VERBAL_CONFESSION') {
        envSetting = s.mu.map(m => jitter(m, 0.06, r));
        posteriorAttributionRisk = 100.0;
      } else {
        const env = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(s, 80, 0.75);
        envSetting = s.mu.map((m, d) => {
          const lo = env.lower_bounds[d], hi = env.upper_bounds[d];
          return Math.min(hi, Math.max(lo, jitter(m, 0.06, r)));
        });
        posteriorAttributionRisk = bayesianPosteriorAttributionPct;
      }
      const ev = PraxeophysicsBlanketEngine.evaluateAlignment(s, envSetting, [true, false, true, false], pPrefPrior, 1.0, 0.75, 80);
      totalVfe += ev.instant_total_vfe;
      if (ev.atomic_predicates.some(ok => !ok)) silentChurnSessions += 1;
    }
    return {
      use_case: '5A_Hospitality_Retail_Silent_Boundary',
      mode,
      silent_churn_pct: Number(((silentChurnSessions / sessions.length) * 100).toFixed(2)),
      mean_vfe: Number((totalVfe / sessions.length).toFixed(4)),
      stigma_exposure_pct: posteriorAttributionRisk,
    };
  };

  // 5B: Group Dining & Travel Coordination (N = 500 groups of 4, D = 4: [budget, diet, acoustics, curfew])
  // Each member mIdx has an off-center unspoken constraint (e.g., tight budget or early curfew around 0.22),
  // while the other 3 members are flexible (low Pi=5) around a higher default (0.62) whose broad radii [0.04, 1.0] still intersect 0.22!
  const rng5B = createRng(502002);
  const groups = Array.from({ length: 500 }, () => {
    const sharedViableTarget = Array.from({ length: 4 }, () => 0.18 + rng5B() * 0.10); // in [0.18, 0.28]
    return Array.from({ length: 4 }, (_, mIdx) => {
      const mu = Array.from({ length: 4 }, (_, d) =>
        d === mIdx ? sharedViableTarget[d] : 0.58 + rng5B() * 0.12
      );
      const rawPi = [4, 4, 4, 4];
      rawPi[mIdx] = 48; // Member mIdx has a strict unspoken boundary on dimension mIdx (r_d ~ 0.188), while others have r_d ~ 0.65
      return {
        mu,
        Pi: normalizePrecisionBudget(rawPi, 60),
        L_load: 0.15,
      };
    });
  });

  const eval5B = (mode) => {
    let failedGroups = 0, totalMemberVfe = 0, attributionRisk = 0;
    for (const grp of groups) {
      let chosenVenue = [0.5, 0.5, 0.5, 0.5];
      if (mode === 'GROUP_CHAT_TATEMAE') {
        // Member mIdx suppresses their off-center constraint ("Anywhere is fine!"), so group picks the average of the other 3 (~0.64)
        for (let d = 0; d < 4; d++) {
          const spoken = grp.map((m, idx) => (idx === d ? 0.62 : m.mu[d]));
          chosenVenue[d] = spoken.reduce((a, b) => a + b, 0) / 4;
        }
        attributionRisk = 0;
      } else if (mode === 'RAW_GROUP_CONFESSION') {
        attributionRisk = 100.0;
        for (let d = 0; d < 4; d++) {
          let num = 0, den = 0;
          for (const m of grp) { num += m.Pi[d] * m.mu[d]; den += m.Pi[d]; }
          chosenVenue[d] = num / den;
        }
      } else {
        attributionRisk = bayesianPosteriorAttributionPct;
        for (let d = 0; d < 4; d++) {
          let lo = -Infinity, hi = Infinity, num = 0, den = 0;
          for (const m of grp) {
            const env = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(m, 60, 0.75);
            const r = env.allowable_radii[d];
            const c = 0.5 * (env.lower_bounds[d] + env.upper_bounds[d]);
            lo = Math.max(lo, env.lower_bounds[d]);
            hi = Math.min(hi, env.upper_bounds[d]);
            const stiff = 2.0 / (r * r);
            num += stiff * c; den += stiff;
          }
          chosenVenue[d] = lo <= hi ? Math.min(hi, Math.max(lo, num / den)) : num / den;
        }
      }
      let grpViolated = false;
      for (const m of grp) {
        const ev = PraxeophysicsBlanketEngine.evaluateAlignment(m, chosenVenue, [true, true, true, true], pPrefPrior, 1.0, 0.75, 60);
        totalMemberVfe += ev.instant_total_vfe;
        if (ev.atomic_predicates.some(ok => !ok)) grpViolated = true;
      }
      if (grpViolated) failedGroups += 1;
    }
    return {
      use_case: '5B_Group_Dining_Travel_Tatemae',
      mode,
      group_success_pct: Number((((groups.length - failedGroups) / groups.length) * 100).toFixed(2)),
      member_violation_group_pct: Number(((failedGroups / groups.length) * 100).toFixed(2)),
      mean_member_vfe: Number((totalMemberVfe / (groups.length * 4)).toFixed(4)),
      privacy_exposure_pct: attributionRisk,
    };
  };

  // 5C: Dating, Marriage & Co-Living Relational Topology (25 pools x 40 agents = 1,000 agents, D = 6)
  const rng5C = createRng(503003);
  const datingPools = Array.from({ length: 25 }, (_, pIdx) =>
    Array.from({ length: 40 }, (_, aIdx) => {
      const mu = Array.from({ length: 6 }, () => rng5C());
      const rawPi = [
        2 + rng5C() * 3,
        2 + rng5C() * 3,
        Math.pow(rng5C() + 0.06, -1.6),
        Math.pow(rng5C() + 0.06, -1.6),
        Math.pow(rng5C() + 0.06, -1.6),
        Math.pow(rng5C() + 0.06, -1.6),
      ];
      return {
        id: `D${pIdx}_${aIdx}`,
        state: { mu, Pi: normalizePrecisionBudget(rawPi, 90), L_load: 0.15 },
      };
    })
  );

  const eval5C = (mode) => {
    const r = createRng(503500 + mode.length);
    let totalPairs = 0, breakupPairs = 0, totalVfe = 0, dualityDelegations = 0, decoupledAutonomies = 0;
    for (const pool of datingPools) {
      if (mode === 'DATING_APP_1D_HOBBY' || mode === 'HOMOGENEITY_6D_MIDPOINT') {
        const used = new Set();
        for (let i = 0; i < pool.length; i++) {
          if (used.has(i)) continue;
          let bestJ = -1, bestDist = Infinity;
          for (let j = i + 1; j < pool.length; j++) {
            if (used.has(j)) continue;
            const dimsToUse = mode === 'DATING_APP_1D_HOBBY' ? [0, 1] : [0, 1, 2, 3, 4, 5];
            const dist = dimsToUse.reduce((acc, d) => acc + Math.abs(pool[i].state.mu[d] - pool[j].state.mu[d]), 0);
            if (dist < bestDist) { bestDist = dist; bestJ = j; }
          }
          used.add(i); used.add(bestJ);
          const a = pool[i].state, b = pool[bestJ].state;
          const mid = a.mu.map((m, d) => jitter(0.5 * (m + b.mu[d]), 0.06, r));
          const eA = PraxeophysicsBlanketEngine.evaluateAlignment(a, mid, [], 0, 1.0, 0.75, 90);
          const eB = PraxeophysicsBlanketEngine.evaluateAlignment(b, mid, [], 0, 1.0, 0.75, 90);
          totalVfe += (eA.instant_total_vfe + eB.instant_total_vfe) / 2;
          if (eA.atomic_predicates.some(ok => !ok) || eB.atomic_predicates.some(ok => !ok)) breakupPairs += 1;
          totalPairs += 1;
        }
      } else {
        const sorted = MultiBlanketReconciliationAdapter.sortCompatibleCohorts(pool, 0.75, 90, 2);
        const byId = new Map(pool.map(x => [x.id, x.state]));
        for (const c of sorted.cohorts) {
          if (c.length < 2) continue;
          const a = byId.get(c[0]), b = byId.get(c[1]);
          const envA = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(a, 90, 0.75);
          const envB = PraxeophysicsBlanketEngine.exportBoundaryEnvelope(b, 90, 0.75);
          const rec = MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA, envB);
          const obsA = [], obsB = [];
          for (let d = 0; d < 6; d++) {
            if (rec.dimension_directives[d] === 'COMPLEMENTARY_DELEGATION') {
              dualityDelegations += 1;
              const u = jitter(rec.optimal_joint_state[d], 0.06, r);
              obsA.push(u); obsB.push(u);
            } else {
              decoupledAutonomies += 1;
              obsA.push(jitter(a.mu[d] + 0.20 * (b.mu[d] - a.mu[d]), 0.06, r));
              obsB.push(jitter(b.mu[d] + 0.20 * (a.mu[d] - b.mu[d]), 0.06, r));
            }
          }
          const eA = PraxeophysicsBlanketEngine.evaluateAlignment(a, obsA, [], 0, 1.0, 0.75, 90);
          const eB = PraxeophysicsBlanketEngine.evaluateAlignment(b, obsB, [], 0, 1.0, 0.75, 90);
          totalVfe += (eA.instant_total_vfe + eB.instant_total_vfe) / 2;
          if (eA.atomic_predicates.some(ok => !ok) || eB.atomic_predicates.some(ok => !ok)) breakupPairs += 1;
          totalPairs += 1;
        }
      }
    }
    return {
      use_case: '5C_Dating_CoLiving_Relational_Topology',
      mode,
      co_living_breakup_pct: Number(((breakupPairs / Math.max(1, totalPairs)) * 100).toFixed(2)),
      mean_pair_vfe: Number((totalVfe / Math.max(1, totalPairs)).toFixed(4)),
      duality_delegation_share_pct: totalPairs > 0 ? Number(((dualityDelegations / (totalPairs * 6)) * 100).toFixed(2)) : 0,
      modular_parallel_share_pct: totalPairs > 0 ? Number(((decoupledAutonomies / (totalPairs * 6)) * 100).toFixed(2)) : 0,
    };
  };

  // 5D: Freelance / B2B / ADR Bilateral Settlement (N = 1,000 viable negotiations where v_A_min <= v_B_max)
  // Strictly exogenous reference benchmark pRef ~ U(0.35, 0.65) independent of private (vMin, vMax)
  const rng5D = createRng(504004);
  const deals = Array.from({ length: 1000 }, () => {
    const vMin = rng5D() * 0.55;           // Seller min in [0.00, 0.55]
    const vMax = 0.45 + rng5D() * 0.55;    // Buyer max in [0.45, 1.00]
    const lo = Math.min(vMin, vMax), hi = Math.max(vMin, vMax);
    const pRef = 0.35 + rng5D() * 0.30;    // Strictly exogenous market benchmark in [0.35, 0.65] (zero peeking at lo/hi)
    return { vMin: lo, vMax: hi, pRef };
  });

  const eval5D = (mode) => {
    let settled = 0, bluffIncentive = 0, exposedThresholds = 0;
    for (const d of deals) {
      if (mode === 'SPLIT_DIFFERENCE_BLUFFING') {
        bluffIncentive += 1;
        exposedThresholds += 1;
        // Under Myerson-Satterthwaite strategic shading, seller inflates by 0.25*(1-vMin) and buyer shades by 0.25*vMax
        const reportedSeller = d.vMin + 0.25 * (1 - d.vMin);
        const reportedBuyer = d.vMax - 0.25 * d.vMax;
        if (reportedSeller <= reportedBuyer) settled += 1;
      } else if (mode === 'PLAIN_MEDIATOR_ESCROW') {
        exposedThresholds += 1;
        if (d.vMin <= d.pRef && d.pRef <= d.vMax) settled += 1;
      } else {
        const res = MultiBlanketReconciliationAdapter.evaluateStrategyProofSettlement(d.vMin, d.vMax, d.pRef);
        if (res.is_settled) settled += 1;
      }
    }
    return {
      use_case: '5D_Bilateral_ADR_Contract_Settlement',
      mode,
      settled_pct: Number(((settled / deals.length) * 100).toFixed(2)),
      bluff_incentive_pct: Number(((bluffIncentive / deals.length) * 100).toFixed(2)),
      threshold_exposure_pct: Number(((exposedThresholds / deals.length) * 100).toFixed(2)),
    };
  };

  return {
    use_case_5A_hospitality_retail: [
      eval5A('POLITE_SILENCE_TATEMAE'),
      eval5A('VERBAL_CONFESSION'),
      eval5A('PRAXEOPHYSICS_DENIABLE_ENVELOPE'),
    ],
    use_case_5B_group_dining_travel: [
      eval5B('GROUP_CHAT_TATEMAE'),
      eval5B('RAW_GROUP_CONFESSION'),
      eval5B('PRAXEOPHYSICS_ENVELOPE_INTERSECTION'),
    ],
    use_case_5C_dating_coliving: [
      eval5C('DATING_APP_1D_HOBBY'),
      eval5C('HOMOGENEITY_6D_MIDPOINT'),
      eval5C('PRAXEOPHYSICS_RELATIONAL_TOPOLOGY'),
    ],
    use_case_5D_adr_settlement: [
      eval5D('SPLIT_DIFFERENCE_BLUFFING'),
      eval5D('PLAIN_MEDIATOR_ESCROW'),
      eval5D('PRAXEOPHYSICS_POSTED_REFERENCE_ZKP'),
    ],
  };
}

const exp1 = [15, 30, 50, 100].flatMap(b => runDyadicSensitivity(b, 0.20));
const exp2_m20 = runPoolMatching(25, 20, 4, 80, 30, 0.20);
const exp2_m100 = runPoolMatching(10, 100, 4, 80, 30, 0.20);
const exp2 = [...exp2_m20, ...exp2_m100];
const exp3 = runEpistemicExplorationBenchmark(500, 5, 100, 30, 0.20);
const exp4 = runHyperparameterSensitivity(0.20);
const exp5 = runCrossDomainUseCases();

const payload = {
  experiment1_dyadic_budget_sweep: exp1,
  experiment2_pool_matching: exp2,
  experiment3_epistemic_exploration: exp3,
  experiment4_hyperparameter_sensitivity: exp4,
  experiment5_cross_domain_use_cases: exp5,
};
fs.writeFileSync(path.join(__dirname, 'benchmark_results.json'), JSON.stringify(payload, null, 2) + '\n');

const lines = [
  '# Praxeophysics Simulation Benchmarks (Reproducible Suite v4 — Boundary-Envelope Calculus & Epistemic EFE)',
  '',
  '## Experiment 1: Dyadic Coupling Budget Sweep via Boundary Envelopes (N = 1,000 dyads × 30 epochs, D = 5, κ = 0.20)',
  '',
  '| Π_budget | Strategy | Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | COMP_DEL (%) | INTF_DEC (%) | EXIT_SORT (%) | LOAD_REL (%) |',
  '| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...exp1.map(r => {
    const d = r.directives_pct || {};
    return `| ${r.piBudget} | ${r.mode} | ${r.violation_pct.toFixed(2)}% | ${r.mean_vfe.toFixed(4)} | ${r.pre_overload_pct.toFixed(2)}% | ${r.post_overload_pct.toFixed(2)}% | ${d.COMPLEMENTARY_DELEGATION ?? '-'} | ${d.INTERFACE_DECOUPLING ?? '-'} | ${d.FRICTIONLESS_EXIT_SORTING ?? '-'} | ${d.ALLOSTATIC_LOAD_RELIEF ?? '-'} |`;
  }),
  '',
  '## Experiment 2: Multi-Scale Pool Cohort Sorting (M = 20 Constrained Pools & M = 100 Large Pools, D = 4, Π_budget = 80, κ = 0.20)',
  '',
  '| Pool Size M | Strategy | Active Cohort (%) | Mean Size | Load Relief (%) | Solo Niche (%) | Violation (%) | Mean VFE | Pre-Overload (%) | Post-Overload (%) | Terminal Cap (1-L) |',
  '| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...exp2.map(r => `| ${r.poolSize} | ${r.mode} | ${r.active_cohort_rate_pct.toFixed(2)}% | ${r.mean_cohort_size.toFixed(2)} | ${r.load_relief_rate_pct.toFixed(2)}% | ${r.solo_niche_rate_pct.toFixed(2)}% | ${r.violation_pct.toFixed(2)}% | ${r.mean_vfe.toFixed(4)} | ${r.pre_overload_pct.toFixed(2)}% | ${r.post_overload_pct.toFixed(2)}% | ${r.mean_terminal_capacity.toFixed(4)} |`),
  '',
  '## Experiment 3: Epistemic Exploration & Information Gain under EFE G(π) (N = 500 dyads × 30 epochs, D = 5, Π_budget = 100, κ = 0.20)',
  '',
  '| Strategy | Mean Epistemic Gain (nats) | Frontier Exploration (%) | Dark-Room Retreat (%) | Guardrail Violation (%) |',
  '| :--- | ---: | ---: | ---: | ---: |',
  ...exp3.map(r => `| ${r.mode} | ${r.mean_epistemic_gain_nats.toFixed(4)} | ${r.frontier_exploration_pct.toFixed(2)}% | ${r.dark_room_retreat_pct.toFixed(2)}% | ${r.violation_pct.toFixed(2)}% |`),
  '',
  '## Experiment 4: Epoch Learning Hyperparameter Sensitivity (N = 500 dyads × 30 epochs, D = 5, Π_budget = 80, κ = 0.20)',
  '',
  '| λ (Decay) | α (Gain) | Violation (%) | Mean VFE | Terminal Cap (1-L) |',
  '| ---: | ---: | ---: | ---: | ---: |',
  ...exp4.map(r => `| ${r.lambda.toFixed(2)} | ${r.alpha.toFixed(2)} | ${r.violation_pct.toFixed(2)}% | ${r.mean_vfe.toFixed(4)} | ${r.terminal_capacity.toFixed(4)} |`),
  '',
  '## Experiment 5: Cross-Domain Killer Use-Case Benchmarks (Hospitality/Retail, Group Dining, Dating/Co-Living, Bilateral ADR)',
  '',
  '### 5A. Silent Hospitality, Salon, Mobility & Retail Alignment (N = 1,000 sessions, D = 4)',
  '| Strategy | Silent Churn / Violation (%) | Mean VFE | Bayesian Attribution Risk (%) |',
  '| :--- | ---: | ---: | ---: |',
  ...exp5.use_case_5A_hospitality_retail.map(r => `| ${r.mode} | ${r.silent_churn_pct.toFixed(2)}% | ${r.mean_vfe.toFixed(4)} | ${r.stigma_exposure_pct.toFixed(2)}% |`),
  '',
  '### 5B. Group Dining & Travel Coordination — Breaking the Tatemae Deadlock (N = 500 groups of 4, D = 4)',
  '| Strategy | Group Success Rate (%) | Hidden Violation Group (%) | Mean Member VFE | Bayesian Attribution Risk (%) |',
  '| :--- | ---: | ---: | ---: | ---: |',
  ...exp5.use_case_5B_group_dining_travel.map(r => `| ${r.mode} | ${r.group_success_pct.toFixed(2)}% | ${r.member_violation_group_pct.toFixed(2)}% | ${r.mean_member_vfe.toFixed(4)} | ${r.privacy_exposure_pct.toFixed(2)}% |`),
  '',
  '### 5C. Dating, Marriage & Co-Living Relational Topology (25 pools × 40 agents, D = 6)',
  '| Strategy | Co-Living Breakup / Violation (%) | Mean Pair VFE | Reciprocal Duality (%) | Modular Parallelism (%) |',
  '| :--- | ---: | ---: | ---: | ---: |',
  ...exp5.use_case_5C_dating_coliving.map(r => `| ${r.mode} | ${r.co_living_breakup_pct.toFixed(2)}% | ${r.mean_pair_vfe.toFixed(4)} | ${r.duality_delegation_share_pct.toFixed(2)}% | ${r.modular_parallel_share_pct.toFixed(2)}% |`),
  '',
  '### 5D. Bilateral Freelance / ADR Contract Settlement (N = 1,000 viable deals)',
  '| Strategy | Deal Settlement Rate (%) | Strategic Bluff Incentive (%) | Reservation Exposure (%) |',
  '| :--- | ---: | ---: | ---: |',
  ...exp5.use_case_5D_adr_settlement.map(r => `| ${r.mode} | ${r.settled_pct.toFixed(2)}% | ${r.bluff_incentive_pct.toFixed(2)}% | ${r.threshold_exposure_pct.toFixed(2)}% |`),
  '',
];

const report = lines.join('\n');
fs.writeFileSync(path.join(__dirname, 'benchmark_report.md'), report);
console.log(report);
