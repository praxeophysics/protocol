import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertValidState,
  normalizePrecisionBudget,
  PraxeophysicsBlanketEngine,
  MultiBlanketReconciliationAdapter,
} from '../dist/reference_engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REL_ROOT = path.resolve(__dirname, '..');

function seededRng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function validateAgainstSchema(data, schema) {
  if (schema.oneOf) {
    return schema.oneOf.some(sub => validateAgainstSchema(data, sub));
  }
  if (schema.allOf) {
    if (!schema.allOf.every(sub => validateAgainstSchema(data, sub))) return false;
  }
  if (schema.const !== undefined && data !== schema.const) return false;
  if (schema.enum && !schema.enum.includes(data)) return false;
  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
    if (schema.required && !schema.required.every(k => Object.prototype.hasOwnProperty.call(data, k))) return false;
    if (schema.properties) {
      for (const [k, sub] of Object.entries(schema.properties)) {
        if (Object.prototype.hasOwnProperty.call(data, k) && !validateAgainstSchema(data[k], sub)) return false;
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(data)) return false;
    if (schema.minItems !== undefined && data.length < schema.minItems) return false;
    if (schema.contains && !data.some(item => validateAgainstSchema(item, schema.contains))) return false;
    if (schema.items && !data.every(item => validateAgainstSchema(item, schema.items))) return false;
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') return false;
    if (schema.minLength !== undefined && data.length < schema.minLength) return false;
    if (schema.pattern && !(new RegExp(schema.pattern)).test(data)) return false;
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') return false;
  }
  return true;
}

test('assertValidState and evaluateAlignment reject malformed inputs', () => {
  assert.throws(() => assertValidState({ mu: [], Pi: [], L_load: 0.1 }));
  assert.throws(() => assertValidState({ mu: [0.5], Pi: [1.0, 2.0], L_load: 0.1 }));
  assert.throws(() => assertValidState({ mu: [0.5], Pi: [0], L_load: 0.1 }));
  assert.throws(() => assertValidState({ mu: [0.5], Pi: [1.0], L_load: 1.0 }));
  assert.throws(() => PraxeophysicsBlanketEngine.evaluateAlignment({ mu: [0.5, 0.5], Pi: [1, 1], L_load: 0.1 }, [0.5, 0.5], [true]));
});

test('normalizePrecisionBudget enforces finite budget conservation proportionally', () => {
  const scaled = normalizePrecisionBudget([10, 20, 30], 12);
  assert.ok(Math.abs(scaled.reduce((a, b) => a + b, 0) - 12) < 1e-12);
  assert.ok(Math.abs(scaled[0] - 2) < 1e-12);
});

test('evaluateAlignment derives radii, one-sided OR bounds, and two-sided RR bounds', () => {
  const state = { mu: [0.2, 0.8], Pi: [8.0, 2.0], L_load: 0.2 };
  const evalRes = PraxeophysicsBlanketEngine.evaluateAlignment(state, [0.7, 0.7], [false, false], 0.25);
  assert.deepEqual(evalRes.atomic_predicates, [false, true]);
  assert.deepEqual(evalRes.pooled_output_flags, [true, false]);
  assert.equal(evalRes.privacy_model, 'one_sided_or_pooling');
  assert.ok(Math.abs(evalRes.privacy_epsilon_bound - Math.log(4)) < 1e-12);
  assert.ok(Math.abs(evalRes.composite_privacy_epsilon_bound - Math.log(4)) < 1e-12);

  const rrRes = PraxeophysicsBlanketEngine.evaluateAlignment(
    state, [0.7, 0.7], [false, false], 0.25, 1.0, 0.75, undefined,
    { randomizedResponseFlipProb: 0.2, rng: seededRng(7) }
  );
  assert.equal(rrRes.privacy_model, 'two_sided_randomized_response');
  assert.ok(Math.abs(rrRes.composite_privacy_epsilon_bound - 2 * Math.log(4)) < 1e-12);
});

test('reconcileCoupling reproduces the 4 benchmark regimes and preserves UNSAT diagnosis under overload', () => {
  const c1 = MultiBlanketReconciliationAdapter.reconcileCoupling(
    { mu: [0.3], Pi: [9.0], L_load: 0.15 },
    { mu: [0.7], Pi: [1.0], L_load: 0.15 }
  );
  assert.equal(c1.directive, 'COMPLEMENTARY_DELEGATION');
  assert.ok(Math.abs(c1.residual_joint_vfe - 0.072) < 1e-12);
  assert.ok(Math.abs(c1.asymmetry_reduction_gain - 0.128) < 1e-12);

  const c2 = MultiBlanketReconciliationAdapter.reconcileCoupling(
    { mu: [0.3], Pi: [2.0], L_load: 0.10 },
    { mu: [0.7], Pi: [2.0], L_load: 0.10 }
  );
  assert.equal(c2.directive, 'INTERFACE_DECOUPLING');

  const c3 = MultiBlanketReconciliationAdapter.reconcileCoupling(
    { mu: [0.3], Pi: [50.0], L_load: 0.20 },
    { mu: [0.7], Pi: [50.0], L_load: 0.20 }
  );
  assert.equal(c3.directive, 'FRICTIONLESS_EXIT_SORTING');

  const c4 = MultiBlanketReconciliationAdapter.reconcileCoupling(
    { mu: [0.3], Pi: [50.0], L_load: 0.85 },
    { mu: [0.7], Pi: [50.0], L_load: 0.10 }
  );
  assert.equal(c4.directive, 'ALLOSTATIC_LOAD_RELIEF');
  assert.equal(c4.is_satisfiable, false);
  assert.deepEqual(c4.unsat_dimensions, [0]);
});

test('C15 (Claim_Interior_Opacity_Principle): exportBoundaryEnvelope and reconcileEnvelopes match directives without exposing raw Pi or L_load', () => {
  const envA1 = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.3], Pi: [9.0], L_load: 0.15 });
  const envB1 = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.7], Pi: [1.0], L_load: 0.15 });
  assert.equal('Pi' in envA1, false);
  assert.equal('L_load' in envA1, false);
  const r1 = MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA1, envB1);
  assert.equal(r1.directive, 'COMPLEMENTARY_DELEGATION');
  assert.ok(Math.abs(r1.optimal_joint_state[0] - 0.34) < 1e-12);

  const envA2 = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.3], Pi: [2.0], L_load: 0.10 });
  const envB2 = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.7], Pi: [2.0], L_load: 0.10 });
  assert.equal(MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA2, envB2).directive, 'INTERFACE_DECOUPLING');

  const envA3 = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.3], Pi: [50.0], L_load: 0.20 });
  const envB3 = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.7], Pi: [50.0], L_load: 0.20 });
  assert.equal(MultiBlanketReconciliationAdapter.reconcileEnvelopes(envA3, envB3).directive, 'FRICTIONLESS_EXIT_SORTING');

  const envOver = PraxeophysicsBlanketEngine.exportBoundaryEnvelope({ mu: [0.3], Pi: [50.0], L_load: 0.85 });
  assert.equal(envOver.requires_load_relief, true);
  assert.equal(envOver.lower_bounds, null);
  assert.equal(MultiBlanketReconciliationAdapter.reconcileEnvelopes(envOver, envB2).directive, 'ALLOSTATIC_LOAD_RELIEF');
});

test('C30-C31 (Claim_Homeostatic_Capacity_Unlocks_Exploration): evaluateExpectedFreeEnergy unlocks epistemic exploration as L_load decreases', () => {
  const policies = [
    { id: 'dark_room_safe', expected_stimulus: [0.5, 0.5], exploration_variance: [0.001, 0.001] },
    { id: 'moderate_explore', expected_stimulus: [0.55, 0.55], exploration_variance: [0.04, 0.04] },
    { id: 'high_epistemic', expected_stimulus: [0.55, 0.55], exploration_variance: [0.12, 0.12] },
  ];
  const highLoadAgent = { mu: [0.5, 0.5], Pi: [10.0, 10.0], L_load: 0.72 };
  const lowLoadAgent = { mu: [0.5, 0.5], Pi: [10.0, 10.0], L_load: 0.10 };
  const overloadedAgent = { mu: [0.5, 0.5], Pi: [10.0, 10.0], L_load: 0.82 };

  const resHighLoad = PraxeophysicsBlanketEngine.evaluateExpectedFreeEnergy(highLoadAgent, policies, 1.0);
  const resLowLoad = PraxeophysicsBlanketEngine.evaluateExpectedFreeEnergy(lowLoadAgent, policies, 1.0);
  const resOver = PraxeophysicsBlanketEngine.evaluateExpectedFreeEnergy(overloadedAgent, policies, 1.0);

  assert.equal(resHighLoad.selected_policy_id, 'dark_room_safe');
  assert.equal(resLowLoad.selected_policy_id, 'high_epistemic');
  assert.ok(resLowLoad.epistemic_value > resHighLoad.epistemic_value * 10);
  assert.equal(resOver.requires_load_relief, true);
  assert.equal(resOver.selected_policy_id, null);
});

test('Property test: VFE identity and SAT/UNSAT geometric equivalence across 1000 random pairs', () => {
  const rng = seededRng(20261115);
  for (let i = 0; i < 1000; i++) {
    const D = 1 + Math.floor(rng() * 5);
    const muA = Array.from({ length: D }, () => rng());
    const muB = Array.from({ length: D }, () => rng());
    const piA = Array.from({ length: D }, () => 0.2 + rng() * 20);
    const piB = Array.from({ length: D }, () => 0.2 + rng() * 20);
    const LA = rng() * 0.7;
    const LB = rng() * 0.7;
    const res = MultiBlanketReconciliationAdapter.reconcileCoupling(
      { mu: muA, Pi: piA, L_load: LA },
      { mu: muB, Pi: piB, L_load: LB }
    );
    assert.ok(Math.abs(res.midpoint_compromise_vfe - (res.residual_joint_vfe + res.asymmetry_reduction_gain)) < 1e-10);
    for (let d = 0; d < D; d++) {
      const rA = Math.sqrt((2 * (1 - LA)) / piA[d]);
      const rB = Math.sqrt((2 * (1 - LB)) / piB[d]);
      const intersects = Math.max(muA[d] - rA, muB[d] - rB) <= Math.min(muA[d] + rA, muB[d] + rB) + 1e-12;
      assert.equal(!intersects, res.unsat_dimensions.includes(d));
    }
  }
});

test('C46 (Claim_Precision_Inflation_Deterrence): Strategic precision inflation under budget=100 triggers dilution and UNSAT exclusion', () => {
  const honestA = { mu: [0.2, 0.5, 0.5], Pi: [40.0, 30.0, 30.0], L_load: 0.1 };
  const inflatedA = { mu: [0.2, 0.5, 0.5], Pi: [1000.0, 1000.0, 1000.0], L_load: 0.1 };
  const norm = normalizePrecisionBudget(inflatedA.Pi, 100);
  assert.ok(norm[0] < honestA.Pi[0]);

  const extremeSingle = { mu: [0.2, 0.5, 0.5], Pi: [99.8, 0.1, 0.1], L_load: 0.1 };
  const moderatePartner = { mu: [0.9, 0.5, 0.5], Pi: [8.0, 46.0, 46.0], L_load: 0.1 };
  const resUnsat = MultiBlanketReconciliationAdapter.reconcileCoupling(extremeSingle, moderatePartner, 0.75, 100);
  assert.equal(resUnsat.is_satisfiable, false);
  assert.equal(resUnsat.directive, 'FRICTIONLESS_EXIT_SORTING');
});

test('stepEpochLearning recovers capacity and protects high-Pi priors', () => {
  let curr = { mu: [0.2, 0.8], Pi: [18.0, 2.0], L_load: 0.60 };
  for (let t = 0; t < 10; t++) {
    curr = PraxeophysicsBlanketEngine.stepEpochLearning(curr, [0.2, 0.8]).next_state;
    assertValidState(curr);
  }
  assert.ok(curr.L_load < 0.1);
  const stressed = PraxeophysicsBlanketEngine.stepEpochLearning({ mu: [0.2, 0.8], Pi: [18.0, 2.0], L_load: 0.2 }, [0.5, 0.5]);
  assert.ok(Math.abs(stressed.next_state.mu[0] - 0.2) < Math.abs(stressed.next_state.mu[1] - 0.8));
});

test('sortCompatibleCohorts guarantees zero internal UNSAT pairs, respects maxCohortSize, and minimizes intra-cohort VFE', () => {
  const agents = [
    { id: 'A1', state: { mu: [0.1], Pi: [40.0], L_load: 0.1 } },
    { id: 'B1', state: { mu: [0.85], Pi: [40.0], L_load: 0.1 } },
    { id: 'A2', state: { mu: [0.12], Pi: [40.0], L_load: 0.1 } },
    { id: 'B2', state: { mu: [0.88], Pi: [40.0], L_load: 0.1 } },
    { id: 'Tired', state: { mu: [0.5], Pi: [2.0], L_load: 0.82 } },
  ];
  const sorted = MultiBlanketReconciliationAdapter.sortCompatibleCohorts(agents, 0.75, undefined, 2);
  assert.deepEqual(sorted.load_relief_agent_ids, ['Tired']);
  assert.equal(sorted.cohorts.length, 2);
  assert.ok(sorted.cohorts.every(c => c.length === 2));
  assert.ok(sorted.mean_intra_cohort_vfe < 0.02);
});

test('Posted-Reference DSIC settlement satisfies strategy-proofness', () => {
  for (const pRef of [350, 400, 500, 600, 650]) {
    const h = MultiBlanketReconciliationAdapter.evaluateStrategyProofSettlement(400, 600, pRef);
    const pH = h.is_settled ? h.settlement_value - 400 : 0;
    for (const fake of [300, 450, 550, 700]) {
      const f = MultiBlanketReconciliationAdapter.evaluateStrategyProofSettlement(fake, 600, pRef);
      assert.ok(pH >= (f.is_settled ? f.settlement_value - 400 : 0));
    }
  }
});

test('JSON Schema validation passes valid v4.2 claims & A2A handshakes and rejects invalid payloads', () => {
  const claim = JSON.parse(fs.readFileSync(path.join(REL_ROOT, 'schemas', 'boundary-claim.v4.2.jsonld'), 'utf8'));
  const claimSchema = JSON.parse(fs.readFileSync(path.join(REL_ROOT, 'schemas', 'boundary-claim.v4.2.schema.json'), 'utf8'));
  const a2aSchema = JSON.parse(fs.readFileSync(path.join(REL_ROOT, 'schemas', 'a2a-handshake.v4.2.schema.json'), 'utf8'));

  assert.equal(validateAgainstSchema(claim, claimSchema), true);
  const badClaim = structuredClone(claim);
  badClaim.credentialSubject.predicateCommitment = 'invalid-hash';
  assert.equal(validateAgainstSchema(badClaim, claimSchema), false);

  const a2aMessages = [
    { step: '1_SCHEMA_EXCHANGE', sessionId: 's1', ontologyRef: 'urn:praxeophysics:ontology:core:v4.2', supportedModes: ['ZeroKnowledgeProof'] },
    { step: '2_REQUEST_POLICY', sessionId: 's1', ontologyRef: 'urn:praxeophysics:ontology:core:v4.2', ruleCircuitId: 'rc-1', requiredDimensions: ['acoustic'] },
    { step: '3_SUBMIT_PROOF', sessionId: 's1', verificationMode: 'ZeroKnowledgeProof', predicateCommitment: '0x' + 'a'.repeat(64), pooledFlags: [true] },
    { step: '4_ISSUE_SETTLEMENT', sessionId: 's1', verified: true, directive: 'COMPLEMENTARY_DELEGATION' },
  ];
  for (const msg of a2aMessages) {
    assert.equal(validateAgainstSchema(msg, a2aSchema), true);
  }
  assert.equal(validateAgainstSchema({ step: '4_ISSUE_SETTLEMENT', sessionId: 's1', verified: true, directive: 'UNKNOWN' }, a2aSchema), false);
});
