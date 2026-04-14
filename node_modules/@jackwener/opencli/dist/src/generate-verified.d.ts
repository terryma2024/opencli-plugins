/**
 * Verified adapter generation:
 * discover → synthesize → candidate-bound probe → single-session verify.
 *
 * v1 contract keeps scope narrow:
 *   - PUBLIC + COOKIE only
 *   - read-only JSON API surfaces
 *   - single best candidate only
 *   - bounded repair: select/itemPath replacement once
 *
 * Contract design principles:
 *   1. machine-readable
 *   2. explicit + explainable
 *   3. testable + versioned
 *   4. taxonomy by skill decision needs (not internal error sources)
 *   5. early hint / terminal outcome share consistent decision language
 */
import { type IBrowserFactory } from './runtime.js';
import { Strategy } from './registry.js';
export type Stage = 'explore' | 'cascade' | 'synthesize' | 'verify' | 'fallback';
export type Confidence = 'high' | 'medium' | 'low';
export type StopReason = 'no-viable-api-surface' | 'auth-too-complex' | 'no-viable-candidate' | 'execution-environment-unavailable';
export type EscalationReason = 'empty-result' | 'sparse-fields' | 'non-array-result' | 'unsupported-required-args' | 'timeout' | 'selector-mismatch' | 'verify-inconclusive';
export type SuggestedAction = 'stop' | 'inspect-with-browser' | 'ask-for-login' | 'ask-for-sample-arg' | 'manual-review';
export type Reusability = 'verified-artifact' | 'unverified-candidate' | 'not-reusable';
export type EarlyHintReason = 'api-surface-looks-viable' | 'candidate-ready-for-verify' | 'no-viable-api-surface' | 'auth-too-complex' | 'no-viable-candidate';
export interface EarlyHint {
    stage: 'explore' | 'synthesize' | 'cascade';
    continue: boolean;
    reason: EarlyHintReason;
    confidence: Confidence;
    candidate?: {
        name: string;
        command: string;
        path: string | null;
        reusability: 'unverified-candidate' | 'not-reusable';
    };
    message?: string;
}
export type EarlyHintHandler = (hint: EarlyHint) => void;
type SupportedStrategy = Strategy.PUBLIC | Strategy.COOKIE;
export interface GenerateStats {
    endpoint_count: number;
    api_endpoint_count: number;
    candidate_count: number;
    verified: boolean;
    repair_attempted: boolean;
    explore_dir: string;
}
export interface VerifiedAdapter {
    site: string;
    name: string;
    command: string;
    strategy: SupportedStrategy;
    path: string;
    metadata_path?: string;
    reusability: 'verified-artifact';
}
export interface EscalationContext {
    stage: Stage;
    reason: EscalationReason;
    confidence: Confidence;
    suggested_action: SuggestedAction;
    candidate: {
        name: string;
        command: string;
        path: string | null;
        reusability: Reusability;
    };
}
export type GenerateOutcome = {
    status: 'success' | 'blocked' | 'needs-human-check';
    adapter?: VerifiedAdapter;
    reason?: StopReason;
    stage?: Stage;
    confidence?: Confidence;
    escalation?: EscalationContext;
    reusability?: Reusability;
    message?: string;
    stats: GenerateStats;
};
export interface GenerateVerifiedOptions {
    url: string;
    BrowserFactory: new () => IBrowserFactory;
    goal?: string | null;
    site?: string;
    waitSeconds?: number;
    top?: number;
    workspace?: string;
    noRegister?: boolean;
    onEarlyHint?: EarlyHintHandler;
}
export interface VerifiedArtifactMetadata {
    artifact_kind: 'verified';
    schema_version: 1;
    source_url: string;
    goal: string | null;
    strategy: SupportedStrategy;
    verified: true;
    reusable: true;
    reusability_reason: 'verified-artifact';
}
export declare function generateVerifiedFromUrl(opts: GenerateVerifiedOptions): Promise<GenerateOutcome>;
export declare function renderGenerateVerifiedSummary(result: GenerateOutcome): string;
export {};
