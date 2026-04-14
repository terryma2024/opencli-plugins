/**
 * Generate skill: thin wrapper over generateVerifiedFromUrl.
 *
 * Maps GenerateOutcome → SkillOutput.
 * Used by `opencli generate <url>` (automated path in opencli-explorer workflow).
 *
 * Design:
 *   - Input: url + goal? (user intent, not execution strategy)
 *   - Output: machine-readable decision fields + human-readable message
 *   - Single source of truth: P1 GenerateOutcome
 *   - No re-orchestration, no auto-escalation to browser
 */
import { type GenerateOutcome, type StopReason, type EscalationReason, type SuggestedAction, type Reusability } from './generate-verified.js';
import type { IBrowserFactory } from './runtime.js';
export interface SkillInput {
    url: string;
    goal?: string;
}
export interface SkillOutput {
    conclusion: 'success' | 'blocked' | 'needs-human-check';
    reason?: StopReason | EscalationReason;
    suggested_action?: SuggestedAction;
    reusability?: Reusability;
    command?: string;
    strategy?: string;
    path?: string;
    message: string;
}
export declare function mapOutcomeToSkillOutput(outcome: GenerateOutcome): SkillOutput;
export declare function executeGenerateSkill(input: SkillInput, BrowserFactory: new () => IBrowserFactory): Promise<SkillOutput>;
