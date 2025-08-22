import { describe, it, expect, vi } from 'vitest';

describe('Basic Test Environment', () => {
    it('应该能够运行基础测试', () => {
        expect(1 + 1).toBe(2);
    });

    it('应该支持异步测试', async () => {
        const promise = Promise.resolve(42);
        const result = await promise;
        expect(result).toBe(42);
    });

    it('应该支持Mock函数', () => {
        const mockFn = vi.fn();
        mockFn('hello');
        expect(mockFn).toHaveBeenCalledWith('hello');
    });
});