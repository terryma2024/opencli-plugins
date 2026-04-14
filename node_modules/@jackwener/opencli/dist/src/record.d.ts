/**
 * Record mode — capture API calls from a live browser session.
 *
 * Flow:
 *   1. Navigate to the target URL in an automation tab
 *   2. Inject a full-capture fetch/XHR interceptor (records url + method + body)
 *   3. Poll every 2s and print newly captured requests
 *   4. User operates the page; press Enter to stop
 *   5. Analyze captured requests → infer capabilities → write YAML candidates
 *
 * Design: no new daemon endpoints, no extension changes.
 * Uses existing exec + navigate actions only.
 */
import type { IPage } from './types.js';
import { findArrayPath } from './analysis.js';
export interface RecordedRequest {
    url: string;
    method: string;
    status: number | null;
    /** Request content type captured at record time, if available. */
    requestContentType: string | null;
    /** Response content type captured at record time, if available. */
    responseContentType: string | null;
    /** Parsed JSON request body for replayable write requests. */
    requestBody: unknown;
    /** Parsed JSON response body captured from the network call. */
    responseBody: unknown;
    contentType: string;
    body: unknown;
    capturedAt: number;
}
export interface RecordResult {
    site: string;
    url: string;
    requests: RecordedRequest[];
    outDir: string;
    candidateCount: number;
    candidates: Array<{
        name: string;
        path: string;
        strategy: string;
    }>;
}
type RecordedCandidateKind = 'read' | 'write';
export interface RecordedCandidate {
    kind: RecordedCandidateKind;
    req: RecordedRequest;
    arrayResult: ReturnType<typeof findArrayPath> | null;
}
interface GeneratedRecordedCandidate {
    kind: RecordedCandidateKind;
    name: string;
    strategy: string;
    yaml: unknown;
}
/** Build one normalized recorded entry from captured request and response values. */
export declare function createRecordedEntry(input: {
    url: string;
    method: string;
    requestContentType?: string | null;
    requestBodyText?: string | null;
    responseBody: unknown;
    responseContentType?: string | null;
    status?: number | null;
    capturedAt?: number;
}): RecordedRequest;
/**
 * Generates a full-capture interceptor that stores {url, method, status, body}
 * for every JSON response. No URL pattern filter — captures everything.
 */
export declare function generateFullCaptureInterceptorJs(): string;
/** Analyze recorded requests into read and write candidates, filtering out noise. */
export declare function analyzeRecordedRequests(requests: RecordedRequest[]): {
    candidates: RecordedCandidate[];
};
/** Build a minimal YAML candidate for replayable JSON write requests. */
export declare function buildWriteRecordedYaml(site: string, pageUrl: string, req: RecordedRequest, capName: string): {
    name: string;
    yaml: unknown;
};
/** Turn recorded requests into YAML-ready read and write candidates. */
export declare function generateRecordedCandidates(site: string, pageUrl: string, requests: RecordedRequest[]): GeneratedRecordedCandidate[];
export interface RecordOptions {
    BrowserFactory: new () => {
        connect(o?: unknown): Promise<IPage>;
        close(): Promise<void>;
    };
    site?: string;
    url: string;
    outDir?: string;
    pollMs?: number;
    timeoutMs?: number;
}
export declare function recordSession(opts: RecordOptions): Promise<RecordResult>;
export declare function renderRecordSummary(result: RecordResult): string;
export {};
