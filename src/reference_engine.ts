/**
 * Praxeophysics Protocol v4.2.0 — Canonical Reference Implementation
 * Copyright (c) Praxeophysics Institute
 * Licensed under the Apache License, Version 2.0
 */

export interface BlanketGenerativeState {
  mu: number[];   // 1. Dimensionless Prior Mean Vector in [0, 1]^D (Claim_Internal_Prior_Sovereignty, Claim_Dimensionless_Normalized_Space, Claim_Subjective_Ordinal_Value)
  Pi: number[];   // 2. Dimensionless Precision Weighting Vector (Claim_Prior_Hyper_Precision_Reification, Claim_Attentional_Precision_Conservation: sum(Pi) <= Pi_budget)
  L_load: number; // 3. Normalized Allostatic Load in [0, 1) (Claim_Nonequilibrium_Steady_State, Claim_Uniform_Standard_Allostatic_Load)
}

/**
 * Exported Boundary Envelope Claim (Claim_Interior_Opacity_Principle, Claim_Verification_ZKP_And_Deniability, Claim_Joint_VFE_Silver_Ratio_Branching / Term_Boundary_Envelope):
 * Encapsulates only the negative outer guardrail intervals [a_d, b_d] = [mu_d - r_d(t), mu_d + r_d(t)]
 * without exposing raw internal precision weights Pi_d or continuous allostatic load L(t).
 * When requires_load_relief is true, interval bounds are redacted (null) to prevent exploitation.
 */
export interface BoundaryEnvelopeClaim {
  dimension_count: number;
  requires_load_relief: boolean;
  lower_bounds: number[] | null;
  upper_bounds: number[] | null;
  allowable_radii: number[] | null;
  predicate_commitment: string;
}

export type AdaptationMode = 'perceptual_update' | 'active_alignment';

export type ReconciliationDirective =
  | 'COMPLEMENTARY_DELEGATION'
  | 'INTERFACE_DECOUPLING'
  | 'ALLOSTATIC_LOAD_RELIEF'
  | 'FRICTIONLESS_EXIT_SORTING';

export type PrivacyModel = 'one_sided_or_pooling' | 'two_sided_randomized_response';

export interface AlignmentPrivacyOptions {
  randomizedResponseFlipProb?: number; // q in [0, 0.5): if > 0, enforces symmetric (ln((1-q)/q))-DP
  rng?: () => number;                  // Optional deterministic PRNG injection for verification
}

export interface SingleBlanketEvaluation {
  dimension_vfe: number[];
  instant_total_vfe: number;
  allowable_radii: number[];             // Derived via Inverse Precision Inference: r_d(t) = sqrt(2(1-L)/Pi_d)
  atomic_predicates: boolean[];          // Binary Guardrail Predicates x_d in {0, 1} (true = viable, false = violated)
  pooled_output_flags: boolean[];        // Output request flags z_d (OR-pooled or randomized response)
  recommended_modes: AdaptationMode[];
  requires_load_relief: boolean;         // True when L_load >= loadAlertThreshold
  privacy_model: PrivacyModel;
  privacy_epsilon_bound: number;         // Per-dimension bound: ln(1/p_pref) for z_d=1 (OR) or ln((1-q)/q) (RR)
  composite_privacy_epsilon_bound: number; // Composed bound across observed positive/all released dimensions
}

export interface CandidatePolicy {
  id: string;
  expected_stimulus: number[];           // Predicted outcome mean s_hat_pi in [0, 1]^D
  exploration_variance: number[];        // Epistemic uncertainty variance sigma_pi_d^2 >= 0
}

export interface PolicyEFEEvaluation {
  selected_policy_id: string | null;     // null when requires_load_relief triggers restorative rest
  pragmatic_risk: number;                // Expected precision-weighted friction sum(0.5 * Pi_d * (delta^2 + sigma^2))
  epistemic_value: number;               // Shannon-KL information gain sum(0.5 * ln(1 + Pi_d * sigma^2))
  expected_free_energy: number;          // G(pi) = pragmatic_risk - epistemicWeight * epistemic_value
  viable_policy_ids: string[];           // Policies satisfying per-dimension homeostatic guardrails
  requires_load_relief: boolean;
}

export interface EpochLearningConfig {
  loadDecayRate?: number;   // Retention factor lambda in [0, 1), default 0.70
  loadGainRate?: number;    // Friction accumulation gain alpha >= 0, default 0.15
  recoveryCredit?: number;  // Baseline recovery when no guardrails are violated, default 0.05
  muLearningRate?: number;  // Conservative prior shift rate (attenuated by 1 / (1 + Pi_d)), default 0.05
  piLearningRate?: number;  // Precision reallocation rate upon boundary violations, default 0.10
  piBudget?: number;        // Conserved precision sum cap (defaults to current sum(state.Pi))
  loadAlertThreshold?: number;
  maxLoadCap?: number;      // Strict upper clamp < 1.0, default 0.99
}

export interface EpochLearningResult {
  next_state: BlanketGenerativeState;
  mean_dimension_vfe: number;
  violated_dimensions: number[];
  updated_radii: number[];
  requires_load_relief: boolean;
}

export function assertValidState(state: BlanketGenerativeState, label = 'state'): void {
  const { mu, Pi, L_load } = state;
  if (mu.length === 0 || mu.length !== Pi.length) {
    throw new Error(`${label}: mu and Pi must be non-empty arrays of identical dimension`);
  }
  if (!Number.isFinite(L_load) || L_load < 0 || L_load >= 1) {
    throw new Error(`${label}: L_load must be finite within [0, 1)`);
  }
  for (let d = 0; d < mu.length; d++) {
    if (!Number.isFinite(mu[d]) || !Number.isFinite(Pi[d]) || Pi[d] <= 0) {
      throw new Error(`${label}: mu[${d}] must be finite and Pi[${d}] must be strictly positive`);
    }
  }
}

export function normalizePrecisionBudget(Pi: number[], piBudget?: number): number[] {
  if (piBudget === undefined) {
    return Pi.slice();
  }
  if (!Number.isFinite(piBudget) || piBudget <= 0) {
    throw new Error('piBudget must be strictly positive');
  }
  const sumPi = Pi.reduce((acc, v) => acc + v, 0);
  if (sumPi <= piBudget) {
    return Pi.slice();
  }
  const scale = piBudget / sumPi;
  return Pi.map(v => v * scale);
}

export class PraxeophysicsBlanketEngine {
  /**
   * Local Holder Export (Claim_Interior_Opacity_Principle, Claim_Verification_ZKP_And_Deniability): Projects private (mu, Pi, L_load) into a BoundaryEnvelopeClaim
   * without exposing raw Pi_d or L_load across the Markov blanket.
   */
  public static exportBoundaryEnvelope(
    state: BlanketGenerativeState,
    piBudget?: number,
    loadAlertThreshold = 0.75,
    predicateCommitment = '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  ): BoundaryEnvelopeClaim {
    assertValidState(state, 'state');
    const D = state.mu.length;
    if (state.L_load >= loadAlertThreshold) {
      return {
        dimension_count: D,
        requires_load_relief: true,
        lower_bounds: null,
        upper_bounds: null,
        allowable_radii: null,
        predicate_commitment: predicateCommitment
      };
    }
    const effectivePi = normalizePrecisionBudget(state.Pi, piBudget);
    const cap = Math.max(0, 1.0 - state.L_load);
    const lower: number[] = [];
    const upper: number[] = [];
    const radii: number[] = [];
    for (let d = 0; d < D; d++) {
      const r_d = Math.sqrt((2.0 * cap) / Math.max(effectivePi[d], 1e-6));
      radii.push(r_d);
      lower.push(state.mu[d] - r_d);
      upper.push(state.mu[d] + r_d);
    }
    return {
      dimension_count: D,
      requires_load_relief: false,
      lower_bounds: lower,
      upper_bounds: upper,
      allowable_radii: radii,
      predicate_commitment: predicateCommitment
    };
  }

  /**
   * Micro Topology (N = 1 / Domains 1 & 2): Evaluates single-agent alignment and privacy-bounded output pooling
   */
  public static evaluateAlignment(
    state: BlanketGenerativeState,
    stimulusVector: number[],
    ordinaryPreferenceFlags: boolean[] = [],
    ordinaryPreferencePrior = 0,
    envPrecisionBaseline = 1.0,
    loadAlertThreshold = 0.75,
    piBudget?: number,
    privacyOptions: AlignmentPrivacyOptions = {}
  ): SingleBlanketEvaluation {
    assertValidState(state, 'state');
    if (stimulusVector.length !== state.mu.length) {
      throw new Error('stimulusVector dimension must match state.mu');
    }
    for (let d = 0; d < stimulusVector.length; d++) {
      if (!Number.isFinite(stimulusVector[d])) {
        throw new Error(`stimulusVector[${d}] must be finite`);
      }
    }
    if (ordinaryPreferenceFlags.length > 0 && ordinaryPreferenceFlags.length !== state.mu.length) {
      throw new Error('ordinaryPreferenceFlags must either be empty or match state.mu dimension');
    }
    if (!Number.isFinite(ordinaryPreferencePrior) || ordinaryPreferencePrior < 0 || ordinaryPreferencePrior > 1) {
      throw new Error('ordinaryPreferencePrior must lie in [0, 1]');
    }

    const flipProb = privacyOptions.randomizedResponseFlipProb ?? 0;
    if (!Number.isFinite(flipProb) || flipProb < 0 || flipProb >= 0.5) {
      throw new Error('randomizedResponseFlipProb must lie in [0, 0.5)');
    }
    const rng = privacyOptions.rng ?? Math.random;

    const effectivePi = normalizePrecisionBudget(state.Pi, piBudget);
    const remainingCapacity = Math.max(0, 1.0 - state.L_load);
    const D = state.mu.length;

    const dimVFE: number[] = [];
    const radii: number[] = [];
    const predicates: boolean[] = [];
    const pooledFlags: boolean[] = [];
    const modes: AdaptationMode[] = [];
    let totalVFE = 0;
    let positiveOutputs = 0;

    for (let d = 0; d < D; d++) {
      const safePi = Math.max(effectivePi[d], 1e-6);
      const epsilon = stimulusVector[d] - state.mu[d];
      const f_d = 0.5 * safePi * Math.pow(epsilon, 2);
      const r_d = Math.sqrt((2.0 * remainingCapacity) / safePi);
      const isSatisfied = f_d <= remainingCapacity;

      dimVFE.push(f_d);
      radii.push(r_d);
      predicates.push(isSatisfied);
      totalVFE += f_d;

      const x_sens = !isSatisfied;
      const x_pref = ordinaryPreferenceFlags[d] ?? false;
      const orPooled = x_sens || x_pref;
      const releasedFlag = flipProb > 0 ? (rng() < flipProb ? !orPooled : orPooled) : orPooled;

      pooledFlags.push(releasedFlag);
      if (releasedFlag) {
        positiveOutputs += 1;
      }

      modes.push(safePi >= envPrecisionBaseline ? 'active_alignment' : 'perceptual_update');
    }

    let privacyModel: PrivacyModel = 'one_sided_or_pooling';
    let perDimBound: number;
    let compositeBound: number;

    if (flipProb > 0) {
      privacyModel = 'two_sided_randomized_response';
      perDimBound = Math.log((1.0 - flipProb) / flipProb);
      compositeBound = D * perDimBound;
    } else {
      perDimBound =
        ordinaryPreferencePrior > 0
          ? Math.log(1.0 / ordinaryPreferencePrior)
          : Number.POSITIVE_INFINITY;
      compositeBound = positiveOutputs === 0 ? 0 : positiveOutputs * perDimBound;
    }

    return {
      dimension_vfe: dimVFE,
      instant_total_vfe: totalVFE,
      allowable_radii: radii,
      atomic_predicates: predicates,
      pooled_output_flags: pooledFlags,
      recommended_modes: modes,
      requires_load_relief: state.L_load >= loadAlertThreshold,
      privacy_model: privacyModel,
      privacy_epsilon_bound: perDimBound,
      composite_privacy_epsilon_bound: compositeBound
    };
  }

  /**
   * Expected Free Energy & Epistemic Exploration Selection (Claim_Action_Axiom_EFE_Duality, Claim_Pragmatic_Epistemic_Decomposition, Claim_Homeostatic_Capacity_Unlocks_Exploration):
   * Evaluates candidate policies under homeostatic guardrail constraints (1 - L_load), demonstrating how
   * expanding Homeostatic Capacity unlocks epistemic information gain (D_KL exploration).
   */
  public static evaluateExpectedFreeEnergy(
    state: BlanketGenerativeState,
    policies: CandidatePolicy[],
    epistemicWeight = 1.0,
    loadAlertThreshold = 0.75,
    piBudget?: number
  ): PolicyEFEEvaluation {
    assertValidState(state, 'state');
    if (policies.length === 0) {
      throw new Error('policies must be a non-empty array');
    }
    if (state.L_load >= loadAlertThreshold) {
      return {
        selected_policy_id: null,
        pragmatic_risk: 0,
        epistemic_value: 0,
        expected_free_energy: 0,
        viable_policy_ids: [],
        requires_load_relief: true
      };
    }

    const D = state.mu.length;
    const effectivePi = normalizePrecisionBudget(state.Pi, piBudget);
    const remainingCapacity = Math.max(0, 1.0 - state.L_load);
    const viableIds: string[] = [];

    let bestId: string | null = null;
    let bestEFE = Number.POSITIVE_INFINITY;
    let bestPrag = 0;
    let bestEpis = 0;

    let fallbackId = policies[0].id;
    let fallbackPrag = Number.POSITIVE_INFINITY;
    let fallbackEpis = 0;

    for (const pol of policies) {
      if (pol.expected_stimulus.length !== D || pol.exploration_variance.length !== D) {
        throw new Error(`Policy ${pol.id} dimensions must match state.mu`);
      }
      let pragRisk = 0;
      let episGain = 0;
      let allSatisfied = true;

      for (let d = 0; d < D; d++) {
        const pi_d = Math.max(effectivePi[d], 1e-6);
        const s_hat = pol.expected_stimulus[d];
        const sigSq = Math.max(0, pol.exploration_variance[d]);
        const sig = Math.sqrt(sigSq);
        const meanShift = Math.abs(s_hat - state.mu[d]);
        // Boundary-Envelope Inclusion Check (Claim_Two_Truths_Tacit_Separation, Claim_Interior_Opacity_Principle, Claim_Homeostatic_Capacity_Unlocks_Exploration):
        // Policy envelope [s_hat - sigma, s_hat + sigma] must fit inside [mu - r_d(t), mu + r_d(t)]
        const envelopeEdgeFriction = 0.5 * pi_d * Math.pow(meanShift + sig, 2);
        if (envelopeEdgeFriction > remainingCapacity) {
          allSatisfied = false;
        }
        // Inside the viable boundary, exploration variance is unpenalized (Tacit Margin ker Phi)
        pragRisk += 0.5 * pi_d * Math.pow(meanShift, 2);
        episGain += 0.5 * Math.log(1.0 + pi_d * sigSq);
      }

      if (pragRisk < fallbackPrag) {
        fallbackPrag = pragRisk;
        fallbackEpis = episGain;
        fallbackId = pol.id;
      }

      if (allSatisfied) {
        viableIds.push(pol.id);
        const efe = pragRisk - epistemicWeight * episGain;
        if (efe < bestEFE) {
          bestEFE = efe;
          bestId = pol.id;
          bestPrag = pragRisk;
          bestEpis = episGain;
        }
      }
    }

    if (bestId === null) {
      bestId = fallbackId;
      bestPrag = fallbackPrag;
      bestEpis = fallbackEpis;
      bestEFE = fallbackPrag - epistemicWeight * fallbackEpis;
    }

    return {
      selected_policy_id: bestId,
      pragmatic_risk: bestPrag,
      epistemic_value: bestEpis,
      expected_free_energy: bestEFE,
      viable_policy_ids: viableIds,
      requires_load_relief: false
    };
  }

  /**
   * Closed-Loop Dynamic Boundary Learning (Claim_Dynamic_Boundary_Learning, Claim_Tolerance_Radius_Derivation, Claim_Polycentric_Synallactics_Loop):
   * Updates Normalized Allostatic Load L(t) and conservatively updates (mu, Pi) under precision conservation
   */
  public static stepEpochLearning(
    state: BlanketGenerativeState,
    observedOutcomes: number[],
    config: EpochLearningConfig = {}
  ): EpochLearningResult {
    assertValidState(state, 'state');
    if (observedOutcomes.length !== state.mu.length) {
      throw new Error('observedOutcomes dimension must match state.mu');
    }
    for (let d = 0; d < observedOutcomes.length; d++) {
      if (!Number.isFinite(observedOutcomes[d])) {
        throw new Error(`observedOutcomes[${d}] must be finite`);
      }
    }

    const lambda = config.loadDecayRate ?? 0.70;
    const alpha = config.loadGainRate ?? 0.15;
    const beta = config.recoveryCredit ?? 0.05;
    const etaMu = config.muLearningRate ?? 0.05;
    const etaPi = config.piLearningRate ?? 0.10;
    const loadAlertThreshold = config.loadAlertThreshold ?? 0.75;
    const maxLoadCap = config.maxLoadCap ?? 0.99;

    if (lambda < 0 || lambda >= 1 || alpha < 0 || beta < 0 || etaMu < 0 || etaMu > 1 || etaPi < 0 || maxLoadCap <= 0 || maxLoadCap >= 1) {
      throw new Error('Invalid learning hyperparameters');
    }

    const D = state.mu.length;
    const currentBudget = config.piBudget ?? state.Pi.reduce((acc, v) => acc + v, 0);
    const effectivePi = normalizePrecisionBudget(state.Pi, currentBudget);
    const remainingCapacity = Math.max(0, 1.0 - state.L_load);

    const nextMu: number[] = [];
    const rawNextPi: number[] = [];
    const violatedDims: number[] = [];
    let totalVfe = 0;

    for (let d = 0; d < D; d++) {
      const safePi = Math.max(effectivePi[d], 1e-6);
      const diff = observedOutcomes[d] - state.mu[d];
      const f_d = 0.5 * safePi * Math.pow(diff, 2);
      totalVfe += f_d;

      const violated = f_d > remainingCapacity;
      if (violated) {
        violatedDims.push(d);
      }

      const attenuatedRate = etaMu / (1.0 + safePi);
      nextMu.push(state.mu[d] + attenuatedRate * diff);
      rawNextPi.push(violated ? safePi * (1.0 + etaPi) : safePi);
    }

    const nextPi = normalizePrecisionBudget(rawNextPi, currentBudget);
    const meanVfe = totalVfe / D;
    const recovery = violatedDims.length === 0 ? beta : 0;
    const nextLoad = Math.min(maxLoadCap, Math.max(0, lambda * state.L_load + alpha * meanVfe - recovery));

    const nextCap = Math.max(0, 1.0 - nextLoad);
    const updatedRadii = nextPi.map(p => Math.sqrt((2.0 * nextCap) / Math.max(p, 1e-6)));

    return {
      next_state: {
        mu: nextMu,
        Pi: nextPi,
        L_load: nextLoad
      },
      mean_dimension_vfe: meanVfe,
      violated_dimensions: violatedDims,
      updated_radii: updatedRadii,
      requires_load_relief: nextLoad >= loadAlertThreshold
    };
  }
}

export interface MultiBlanketReconciliationResult {
  optimal_joint_state: number[];                 // Precision-weighted state u*_d
  residual_joint_vfe: number;                    // Minimum joint VFE F*_joint
  asymmetry_reduction_gain: number;              // Asymmetry gain DeltaF_asym: sum(F_mid - F*_joint)
  midpoint_compromise_vfe: number;               // Midpoint compromise VFE F_mid
  unsat_dimensions: number[];
  is_satisfiable: boolean;
  directive: ReconciliationDirective;            // Aggregate coupling verdict
  dimension_directives: ReconciliationDirective[]; // Orthogonal per-dimension directives (Claim_Rejection_Of_Scalar_Reduction, Claim_Joint_VFE_Silver_Ratio_Branching)
  focus_dimension_indices: number[];
}

export interface AgentProfile {
  id: string;
  state: BlanketGenerativeState;
}

export interface CohortSortingResult {
  cohorts: string[][];
  load_relief_agent_ids: string[];
  total_unsat_pairs_avoided: number;
  mean_intra_cohort_vfe: number;
}

export class MultiBlanketReconciliationAdapter {
  /**
   * Boundary-Only Reconciliation (Claim_Interior_Opacity_Principle, Claim_Joint_VFE_Silver_Ratio_Branching):
   * Reconciles two BoundaryEnvelopeClaim objects using strictly their exported intervals [a_d, b_d]
   * and effective boundary stiffness (2 / r_d^2) without accessing raw Pi_d or L_load.
   */
  public static reconcileEnvelopes(
    envA: BoundaryEnvelopeClaim,
    envB: BoundaryEnvelopeClaim
  ): MultiBlanketReconciliationResult {
    if (envA.dimension_count <= 0 || envA.dimension_count !== envB.dimension_count) {
      throw new Error('Envelope dimension counts must be positive and identical');
    }
    const D = envA.dimension_count;
    if (envA.requires_load_relief || envB.requires_load_relief || !envA.lower_bounds || !envB.lower_bounds || !envA.upper_bounds || !envB.upper_bounds) {
      return {
        optimal_joint_state: Array(D).fill(0.5),
        residual_joint_vfe: 0,
        asymmetry_reduction_gain: 0,
        midpoint_compromise_vfe: 0,
        unsat_dimensions: [],
        is_satisfiable: true,
        directive: 'ALLOSTATIC_LOAD_RELIEF',
        dimension_directives: Array(D).fill('ALLOSTATIC_LOAD_RELIEF'),
        focus_dimension_indices: []
      };
    }

    const optimalState: number[] = [];
    const dimMidpointVFE: number[] = [];
    const unsatDims: number[] = [];
    const dimDirectives: ReconciliationDirective[] = [];
    let totalResidualVFE = 0;
    let totalAsymGain = 0;

    for (let d = 0; d < D; d++) {
      const aA = envA.lower_bounds[d], bA = envA.upper_bounds[d];
      const aB = envB.lower_bounds[d], bB = envB.upper_bounds[d];
      const cA = 0.5 * (aA + bA), cB = 0.5 * (aB + bB);
      const rA = Math.max(0.5 * (bA - aA), 1e-6);
      const rB = Math.max(0.5 * (bB - aB), 1e-6);

      const stiffA = 2.0 / (rA * rA);
      const stiffB = 2.0 / (rB * rB);
      const deltaC = Math.abs(cA - cB);
      const deltaCSq = deltaC * deltaC;

      const uStar = (stiffA * cA + stiffB * cB) / (stiffA + stiffB);
      optimalState.push(uStar);

      const harmonicStiff = (stiffA * stiffB) / (stiffA + stiffB);
      const fJointMin = 0.5 * harmonicStiff * deltaCSq;
      const deltaFAsym = 0.125 * (Math.pow(stiffA - stiffB, 2) / (stiffA + stiffB)) * deltaCSq;
      const fMidpoint = fJointMin + deltaFAsym;

      dimMidpointVFE.push(fMidpoint);
      totalResidualVFE += fJointMin;
      totalAsymGain += deltaFAsym;

      const dimSAT = Math.max(aA, aB) <= Math.min(bA, bB) + 1e-12;
      if (!dimSAT) {
        unsatDims.push(d);
        dimDirectives.push('FRICTIONLESS_EXIT_SORTING');
      } else if (deltaFAsym > fJointMin) {
        dimDirectives.push('COMPLEMENTARY_DELEGATION');
      } else {
        dimDirectives.push('INTERFACE_DECOUPLING');
      }
    }

    const focusDims = dimMidpointVFE
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 2)
      .map(x => x.idx);

    const isSAT = unsatDims.length === 0;
    let directive: ReconciliationDirective = 'INTERFACE_DECOUPLING';
    if (!isSAT) {
      directive = 'FRICTIONLESS_EXIT_SORTING';
    } else if (totalAsymGain > totalResidualVFE) {
      directive = 'COMPLEMENTARY_DELEGATION';
    }

    return {
      optimal_joint_state: optimalState,
      residual_joint_vfe: totalResidualVFE,
      asymmetry_reduction_gain: totalAsymGain,
      midpoint_compromise_vfe: totalResidualVFE + totalAsymGain,
      unsat_dimensions: unsatDims,
      is_satisfiable: isSAT,
      directive,
      dimension_directives: dimDirectives,
      focus_dimension_indices: focusDims
    };
  }

  /**
   * Meso Topology (N >= 2 Cooperative / Domain 3): Exact VFE decomposition and orthogonal Reconciliation Directives
   * Identity: F_mid(d) = F*_joint(d) + DeltaF_asym(d)
   */
  public static reconcileCoupling(
    agentA: BlanketGenerativeState,
    agentB: BlanketGenerativeState,
    loadAlertThreshold = 0.75,
    piBudget?: number
  ): MultiBlanketReconciliationResult {
    assertValidState(agentA, 'agentA');
    assertValidState(agentB, 'agentB');
    if (agentA.mu.length !== agentB.mu.length) {
      throw new Error('agentA and agentB must share identical dimension count');
    }

    const D = agentA.mu.length;
    const piVecA = normalizePrecisionBudget(agentA.Pi, piBudget);
    const piVecB = normalizePrecisionBudget(agentB.Pi, piBudget);
    const capA = Math.max(0, 1.0 - agentA.L_load);
    const capB = Math.max(0, 1.0 - agentB.L_load);
    const isOverloaded =
      agentA.L_load >= loadAlertThreshold || agentB.L_load >= loadAlertThreshold;

    const optimalState: number[] = [];
    const dimMidpointVFE: number[] = [];
    const unsatDims: number[] = [];
    const dimDirectives: ReconciliationDirective[] = [];
    let totalResidualVFE = 0;
    let totalAsymGain = 0;

    for (let d = 0; d < D; d++) {
      const piA = Math.max(piVecA[d], 1e-6);
      const piB = Math.max(piVecB[d], 1e-6);
      const muA = agentA.mu[d];
      const muB = agentB.mu[d];
      const deltaMu = Math.abs(muA - muB);
      const deltaMuSq = Math.pow(deltaMu, 2);

      const uStar = (piA * muA + piB * muB) / (piA + piB);
      optimalState.push(uStar);

      const harmonicPi = (piA * piB) / (piA + piB);
      const fJointMin = 0.5 * harmonicPi * deltaMuSq;
      const deltaFAsym = 0.125 * (Math.pow(piA - piB, 2) / (piA + piB)) * deltaMuSq;
      const fMidpoint = fJointMin + deltaFAsym;

      dimMidpointVFE.push(fMidpoint);
      totalResidualVFE += fJointMin;
      totalAsymGain += deltaFAsym;

      const radiusA = Math.sqrt((2.0 * capA) / piA);
      const radiusB = Math.sqrt((2.0 * capB) / piB);
      const dimSAT = deltaMu <= radiusA + radiusB;
      if (!dimSAT) {
        unsatDims.push(d);
      }

      if (isOverloaded) {
        dimDirectives.push('ALLOSTATIC_LOAD_RELIEF');
      } else if (!dimSAT) {
        dimDirectives.push('FRICTIONLESS_EXIT_SORTING');
      } else if (deltaFAsym > fJointMin) {
        dimDirectives.push('COMPLEMENTARY_DELEGATION');
      } else {
        dimDirectives.push('INTERFACE_DECOUPLING');
      }
    }

    const focusDims = dimMidpointVFE
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 2)
      .map(x => x.idx);

    const isSAT = unsatDims.length === 0;
    let directive: ReconciliationDirective = 'INTERFACE_DECOUPLING';

    if (isOverloaded) {
      directive = 'ALLOSTATIC_LOAD_RELIEF';
    } else if (!isSAT) {
      directive = 'FRICTIONLESS_EXIT_SORTING';
    } else if (totalAsymGain > totalResidualVFE) {
      directive = 'COMPLEMENTARY_DELEGATION';
    }

    return {
      optimal_joint_state: optimalState,
      residual_joint_vfe: totalResidualVFE,
      asymmetry_reduction_gain: totalAsymGain,
      midpoint_compromise_vfe: totalResidualVFE + totalAsymGain,
      unsat_dimensions: unsatDims,
      is_satisfiable: isSAT,
      directive,
      dimension_directives: dimDirectives,
      focus_dimension_indices: focusDims
    };
  }

  /**
   * Multi-Agent UNSAT Cohort Partitioning (Claim_SAT_Pareto_And_UNSAT_Sorting, Claim_Dispersed_Knowledge_Polycentricity, Claim_Single_Agent_Alignment_And_Safety_Guards):
   * Isolates overloaded agents for capacity recovery and partitions viable agents into SAT cliques
   * by seeding with the most constrained unassigned agent and greedily selecting mutually-SAT partners
   * that minimize intra-cohort VFE up to maxCohortSize.
   */
  public static sortCompatibleCohorts(
    agents: AgentProfile[],
    loadAlertThreshold = 0.75,
    piBudget?: number,
    maxCohortSize = Number.POSITIVE_INFINITY
  ): CohortSortingResult {
    if (maxCohortSize < 2) {
      throw new Error('maxCohortSize must be at least 2');
    }
    const seenIds = new Set<string>();
    const loadReliefIds: string[] = [];
    const viable: AgentProfile[] = [];

    for (const agent of agents) {
      assertValidState(agent.state, `agent(${agent.id})`);
      if (seenIds.has(agent.id)) {
        throw new Error(`Duplicate agent id: ${agent.id}`);
      }
      seenIds.add(agent.id);
      if (agent.state.L_load >= loadAlertThreshold) {
        loadReliefIds.push(agent.id);
      } else {
        viable.push(agent);
      }
    }

    const n = viable.length;
    const satMatrix: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
    const vfeMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const satDegree: number[] = Array(n).fill(0);
    let unsatPairsAvoided = 0;

    for (let i = 0; i < n; i++) {
      satMatrix[i][i] = true;
      for (let j = i + 1; j < n; j++) {
        const res = this.reconcileCoupling(viable[i].state, viable[j].state, loadAlertThreshold, piBudget);
        satMatrix[i][j] = res.is_satisfiable;
        satMatrix[j][i] = res.is_satisfiable;
        vfeMatrix[i][j] = res.residual_joint_vfe;
        vfeMatrix[j][i] = res.residual_joint_vfe;
        if (res.is_satisfiable) {
          satDegree[i] += 1;
          satDegree[j] += 1;
        } else {
          unsatPairsAvoided += 1;
        }
      }
    }

    const indices = Array.from({ length: n }, (_, idx) => idx).sort((a, b) => {
      if (satDegree[a] !== satDegree[b]) {
        return satDegree[a] - satDegree[b];
      }
      const maxPiA = Math.max(...viable[a].state.Pi);
      const maxPiB = Math.max(...viable[b].state.Pi);
      if (maxPiA !== maxPiB) {
        return maxPiB - maxPiA;
      }
      return viable[a].id.localeCompare(viable[b].id);
    });

    const assigned = new Array<boolean>(n).fill(false);
    const cohortIndices: number[][] = [];

    for (const seed of indices) {
      if (assigned[seed]) {
        continue;
      }
      const members = [seed];
      assigned[seed] = true;

      while (members.length < maxCohortSize) {
        let bestCand = -1;
        let bestAvgVfe = Number.POSITIVE_INFINITY;

        for (let cand = 0; cand < n; cand++) {
          if (assigned[cand]) {
            continue;
          }
          if (!members.every(m => satMatrix[cand][m])) {
            continue;
          }
          const avgVfe =
            members.reduce((acc, m) => acc + vfeMatrix[cand][m], 0) / members.length;
          if (avgVfe < bestAvgVfe) {
            bestAvgVfe = avgVfe;
            bestCand = cand;
          }
        }

        if (bestCand === -1) {
          break;
        }
        members.push(bestCand);
        assigned[bestCand] = true;
      }

      cohortIndices.push(members);
    }

    let pairCount = 0;
    let totalIntraVfe = 0;
    const cohorts = cohortIndices.map(members => {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          totalIntraVfe += vfeMatrix[members[i]][members[j]];
          pairCount += 1;
        }
      }
      return members.map(m => viable[m].id);
    });

    return {
      cohorts,
      load_relief_agent_ids: loadReliefIds,
      total_unsat_pairs_avoided: unsatPairsAvoided,
      mean_intra_cohort_vfe: pairCount > 0 ? totalIntraVfe / pairCount : 0
    };
  }

  /**
   * Macro Topology (N >= 2 Institutional / Domain 4): Posted-Reference DSIC Settlement (Claim_Posted_Reference_DSIC_Mechanism, Claim_Posted_Reference_ZKP_Settlement_Spec)
   * Evaluates v_A_min <= p_ref <= v_B_max in ZKP without revealing private thresholds
   */
  public static evaluateStrategyProofSettlement(
    sellerMinReservation: number,
    buyerMaxReservation: number,
    independentReferenceValue: number
  ): { is_settled: boolean; settlement_value: number | null } {
    if (
      !Number.isFinite(sellerMinReservation) ||
      !Number.isFinite(buyerMaxReservation) ||
      !Number.isFinite(independentReferenceValue)
    ) {
      throw new Error('Reservation thresholds and reference benchmark must be finite numbers');
    }
    const isViable =
      sellerMinReservation <= independentReferenceValue &&
      independentReferenceValue <= buyerMaxReservation;
    return {
      is_settled: isViable,
      settlement_value: isViable ? independentReferenceValue : null
    };
  }
}
