/**
 * CLI entry point: registers built-in commands and wires up Commander.
 *
 * Built-in commands are registered inline here (list, validate, explore, etc.).
 * Dynamic adapter commands are registered via commanderAdapter.ts.
 */
import { Command } from 'commander';
import { findPackageRoot } from './package-paths.js';
export declare function createProgram(BUILTIN_CLIS: string, USER_CLIS: string): Command;
export declare function runCli(BUILTIN_CLIS: string, USER_CLIS: string): void;
export interface BrowserVerifyInvocation {
    binary: string;
    args: string[];
    cwd: string;
    shell?: boolean;
}
export { findPackageRoot };
export declare function resolveBrowserVerifyInvocation(opts?: {
    projectRoot?: string;
    platform?: NodeJS.Platform;
    fileExists?: (path: string) => boolean;
    readFile?: (path: string) => string;
}): BrowserVerifyInvocation;
