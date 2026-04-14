/**
 * Page abstraction — implements IPage by sending commands to the daemon.
 *
 * All browser operations are ultimately 'exec' (JS evaluation via CDP)
 * plus a few native Chrome Extension APIs (tabs, cookies, navigate).
 *
 * IMPORTANT: After goto(), we remember the page identity (targetId) returned
 * by the navigate action and pass it to all subsequent commands. This ensures
 * page-scoped operations target the correct page without guessing.
 */
import type { BrowserCookie, ScreenshotOptions } from '../types.js';
import { BasePage } from './base-page.js';
/**
 * Page — implements IPage by talking to the daemon via HTTP.
 */
export declare class Page extends BasePage {
    private readonly workspace;
    constructor(workspace?: string);
    /** Active page identity (targetId), set after navigate and used in all subsequent commands */
    private _page;
    /** Helper: spread workspace into command params */
    private _wsOpt;
    /** Helper: spread workspace + page identity into command params */
    private _cmdOpts;
    goto(url: string, options?: {
        waitUntil?: 'load' | 'none';
        settleMs?: number;
    }): Promise<void>;
    /** Get the active page identity (targetId) */
    getActivePage(): string | undefined;
    /** @deprecated Use getActivePage() instead */
    getActiveTabId(): number | undefined;
    evaluate(js: string): Promise<unknown>;
    getCookies(opts?: {
        domain?: string;
        url?: string;
    }): Promise<BrowserCookie[]>;
    /** Close the automation window in the extension */
    closeWindow(): Promise<void>;
    tabs(): Promise<unknown[]>;
    selectTab(index: number): Promise<void>;
    /**
     * Capture a screenshot via CDP Page.captureScreenshot.
     */
    screenshot(options?: ScreenshotOptions): Promise<string>;
    startNetworkCapture(pattern?: string): Promise<void>;
    readNetworkCapture(): Promise<unknown[]>;
    /**
     * Set local file paths on a file input element via CDP DOM.setFileInputFiles.
     * Chrome reads the files directly from the local filesystem, avoiding the
     * payload size limits of base64-in-evaluate.
     */
    setFileInput(files: string[], selector?: string): Promise<void>;
    insertText(text: string): Promise<void>;
    cdp(method: string, params?: Record<string, unknown>): Promise<unknown>;
    /** CDP native click fallback — called when JS el.click() fails */
    protected tryNativeClick(x: number, y: number): Promise<boolean>;
    /** Precise click using DOM.getContentQuads/getBoxModel for inline elements */
    clickWithQuads(ref: string): Promise<void>;
    nativeClick(x: number, y: number): Promise<void>;
    nativeType(text: string): Promise<void>;
    nativeKeyPress(key: string, modifiers?: string[]): Promise<void>;
}
