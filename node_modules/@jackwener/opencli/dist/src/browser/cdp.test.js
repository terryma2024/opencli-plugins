import { beforeEach, describe, expect, it, vi } from 'vitest';
const { MockWebSocket } = vi.hoisted(() => {
    class MockWebSocket {
        static OPEN = 1;
        readyState = 1;
        handlers = new Map();
        constructor(_url) {
            queueMicrotask(() => this.emit('open'));
        }
        on(event, handler) {
            const handlers = this.handlers.get(event) ?? [];
            handlers.push(handler);
            this.handlers.set(event, handlers);
        }
        send(_message) { }
        close() {
            this.readyState = 3;
        }
        emit(event, ...args) {
            for (const handler of this.handlers.get(event) ?? []) {
                handler(...args);
            }
        }
    }
    return { MockWebSocket };
});
vi.mock('ws', () => ({
    WebSocket: MockWebSocket,
}));
import { CDPBridge } from './cdp.js';
describe('CDPBridge cookies', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
    });
    it('filters cookies by actual domain match instead of substring match', async () => {
        vi.stubEnv('OPENCLI_CDP_ENDPOINT', 'ws://127.0.0.1:9222/devtools/page/1');
        const bridge = new CDPBridge();
        vi.spyOn(bridge, 'send').mockResolvedValue({
            cookies: [
                { name: 'good', value: '1', domain: '.example.com' },
                { name: 'exact', value: '2', domain: 'example.com' },
                { name: 'bad', value: '3', domain: 'notexample.com' },
            ],
        });
        const page = await bridge.connect();
        const cookies = await page.getCookies({ domain: 'example.com' });
        expect(cookies).toEqual([
            { name: 'good', value: '1', domain: '.example.com' },
            { name: 'exact', value: '2', domain: 'example.com' },
        ]);
    });
});
