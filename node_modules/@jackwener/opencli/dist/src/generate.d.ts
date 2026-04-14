/**
 * Generate: one-shot CLI creation from URL.
 *
 * Orchestrates the pipeline:
 *   explore (Deep Explore) → synthesize (YAML generation + candidate ranking)
 */
import type { IBrowserFactory } from './runtime.js';
import { type SynthesizeCandidateSummary, type SynthesizeResult } from './synthesize.js';
export interface GenerateCliOptions {
    url: string;
    BrowserFactory: new () => IBrowserFactory;
    goal?: string | null;
    site?: string;
    waitSeconds?: number;
    top?: number;
    workspace?: string;
}
export interface GenerateCliResult {
    ok: boolean;
    goal?: string | null;
    normalized_goal?: string | null;
    site: string;
    selected_candidate: SynthesizeCandidateSummary | null;
    selected_command: string;
    explore: {
        endpoint_count: number;
        api_endpoint_count: number;
        capability_count: number;
        top_strategy: string;
        framework: Record<string, boolean>;
    };
    synthesize: {
        candidate_count: number;
        candidates: Array<Pick<SynthesizeCandidateSummary, 'name' | 'strategy'>>;
    };
}
/**
 * Normalize a goal string to a standard capability name.
 */
export declare function normalizeGoal(goal?: string | null): string | null;
/**
 * Select the best candidate matching the user's goal.
 */
export declare function selectCandidate(candidates: SynthesizeResult['candidates'], goal?: string | null): SynthesizeCandidateSummary | null;
export declare function generateCliFromUrl(opts: GenerateCliOptions): Promise<GenerateCliResult>;
export declare function renderGenerateSummary(r: GenerateCliResult): string;
