/**
 * Deep Explore: intelligent API discovery with response analysis.
 *
 * Navigates to the target URL, auto-scrolls to trigger lazy loading,
 * captures network traffic, analyzes JSON responses, and automatically
 * infers CLI capabilities from discovered API endpoints.
 */
import type { IBrowserFactory } from './runtime.js';
export declare function detectSiteName(url: string): string;
export declare function slugify(value: string): string;
interface InferredCapability {
    name: string;
    description: string;
    strategy: string;
    endpoint: string;
    itemPath: string | null;
    recommendedColumns: string[];
    recommendedArgs: Array<{
        name: string;
        type: string;
        required: boolean;
        default?: unknown;
    }>;
    storeHint?: {
        store: string;
        action: string;
    };
}
export interface ExploreManifest {
    site: string;
    target_url: string;
    final_url: string;
    title: string;
    framework: Record<string, boolean>;
    stores: Array<{
        type: DiscoveredStore['type'];
        id: string;
        actions: string[];
    }>;
    top_strategy: string;
    explored_at?: string;
}
export interface ExploreAuthSummary {
    top_strategy: string;
    indicators: string[];
    framework: Record<string, boolean>;
}
export interface ExploreEndpointArtifact {
    pattern: string;
    method: string;
    url: string;
    status: number | null;
    contentType: string;
    queryParams: string[];
    itemPath: string | null;
    itemCount: number;
    detectedFields: Record<string, string>;
    authIndicators: string[];
}
export interface ExploreResult {
    site: string;
    target_url: string;
    final_url: string;
    title: string;
    framework: Record<string, boolean>;
    stores: DiscoveredStore[];
    top_strategy: string;
    endpoint_count: number;
    api_endpoint_count: number;
    capabilities: InferredCapability[];
    auth_indicators: string[];
    out_dir: string;
}
export interface ExploreBundle {
    manifest: ExploreManifest;
    endpoints: ExploreEndpointArtifact[];
    capabilities: InferredCapability[];
    auth: ExploreAuthSummary;
}
export interface DiscoveredStore {
    type: 'pinia' | 'vuex';
    id: string;
    actions: string[];
    stateKeys: string[];
}
export declare function exploreUrl(url: string, opts: {
    BrowserFactory: new () => IBrowserFactory;
    site?: string;
    goal?: string;
    authenticated?: boolean;
    outDir?: string;
    waitSeconds?: number;
    query?: string;
    clickLabels?: string[];
    auto?: boolean;
    workspace?: string;
}): Promise<ExploreResult>;
export declare function renderExploreSummary(result: ExploreResult): string;
export {};
