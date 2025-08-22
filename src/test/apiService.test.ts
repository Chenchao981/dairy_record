import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 重置 fetch mock
        mockFetch.mockClear();
    });

    describe('HTTP Request Handling', () => {
        it('应该能够处理成功的GET请求', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test data' }),
            };

            mockFetch.mockResolvedValue(mockResponse);

            const apiCall = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            };

            const result = await apiCall('/api/test');

            expect(mockFetch).toHaveBeenCalledWith('/api/test');
            expect(result).toEqual({ data: 'test data' });
        });

        it('应该能够处理POST请求', async () => {
            const mockResponse = {
                ok: true,
                status: 201,
                json: vi.fn().mockResolvedValue({ success: true, id: 1 }),
            };

            mockFetch.mockResolvedValue(mockResponse);

            const postData = async (url: string, data: any) => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            };

            const testData = { name: 'test', email: 'test@example.com' };
            const result = await postData('/api/users', testData);

            expect(mockFetch).toHaveBeenCalledWith('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData),
            });

            expect(result).toEqual({ success: true, id: 1 });
        });

        it('应该能够处理HTTP错误', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: vi.fn().mockResolvedValue({ error: 'Resource not found' }),
            };

            mockFetch.mockResolvedValue(mockResponse);

            const apiCall = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                return await response.json();
            };

            await expect(apiCall('/api/nonexistent')).rejects.toThrow('Resource not found');
        });

        it('应该能够处理网络错误', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const apiCall = async (url: string) => {
                try {
                    const response = await fetch(url);
                    return await response.json();
                } catch (error) {
                    if (error instanceof Error) {
                        throw new Error(`Network error: ${error.message}`);
                    }
                    throw error;
                }
            };

            await expect(apiCall('/api/test')).rejects.toThrow('Network error: Network error');
        });
    });

    describe('Authentication Headers', () => {
        it('应该能够添加Authorization头', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'authenticated data' }),
            };

            mockFetch.mockResolvedValue(mockResponse);

            const authenticatedRequest = async (url: string, token: string) => {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                return await response.json();
            };

            await authenticatedRequest('/api/protected', 'mock-jwt-token');

            expect(mockFetch).toHaveBeenCalledWith('/api/protected', {
                headers: {
                    'Authorization': 'Bearer mock-jwt-token',
                    'Content-Type': 'application/json',
                },
            });
        });

        it('应该能够处理token过期', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                json: vi.fn().mockResolvedValue({ error: 'Token expired' }),
            };

            mockFetch.mockResolvedValue(mockResponse);

            const authenticatedRequest = async (url: string, token: string) => {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    throw new Error('Authentication failed');
                }

                return await response.json();
            };

            await expect(authenticatedRequest('/api/protected', 'expired-token'))
                .rejects.toThrow('Authentication failed');
        });
    });

    describe('Request Retry Logic', () => {
        it('应该能够实现重试机制', async () => {
            // 前两次失败，第三次成功
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: vi.fn().mockResolvedValue({ data: 'success after retry' }),
                });

            const retryRequest = async (url: string, maxRetries = 3) => {
                let lastError: Error;

                for (let i = 0; i < maxRetries; i++) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            return await response.json();
                        }
                        throw new Error(`HTTP ${response.status}`);
                    } catch (error) {
                        lastError = error as Error;
                        if (i === maxRetries - 1) {
                            throw lastError;
                        }
                        // 简单的延迟
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            };

            const result = await retryRequest('/api/test');

            expect(mockFetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ data: 'success after retry' });
        });

        it('应该在达到最大重试次数后抛出错误', async () => {
            mockFetch.mockRejectedValue(new Error('Persistent network error'));

            const retryRequest = async (url: string, maxRetries = 2) => {
                let lastError: Error;

                for (let i = 0; i < maxRetries; i++) {
                    try {
                        const response = await fetch(url);
                        return await response.json();
                    } catch (error) {
                        lastError = error as Error;
                        if (i === maxRetries - 1) {
                            throw lastError;
                        }
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
            };

            await expect(retryRequest('/api/test')).rejects.toThrow('Persistent network error');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('Response Caching', () => {
        it('应该能够缓存GET请求响应', async () => {
            const cache = new Map<string, any>();

            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'cached data' }),
            };

            mockFetch.mockResolvedValue(mockResponse);

            const cachedRequest = async (url: string) => {
                // 检查缓存
                if (cache.has(url)) {
                    return cache.get(url);
                }

                const response = await fetch(url);
                const data = await response.json();

                // 存储到缓存
                cache.set(url, data);

                return data;
            };

            // 第一次请求
            const result1 = await cachedRequest('/api/data');
            // 第二次请求（应该从缓存返回）
            const result2 = await cachedRequest('/api/data');

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result1).toEqual({ data: 'cached data' });
            expect(result2).toEqual({ data: 'cached data' });
            expect(cache.size).toBe(1);
        });

        it('应该能够清除缓存', () => {
            const cache = new Map<string, any>();
            cache.set('/api/data', { data: 'cached' });

            const clearCache = () => {
                cache.clear();
            };

            expect(cache.size).toBe(1);
            clearCache();
            expect(cache.size).toBe(0);
        });
    });

    describe('Request Timeout', () => {
        it('应该能够处理请求超时', async () => {
            // Mock一个永远不resolve的Promise来模拟超时
            mockFetch.mockImplementation(() => new Promise(() => { }));

            const requestWithTimeout = async (url: string, timeout = 1000) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                try {
                    const response = await fetch(url, {
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                    return await response.json();
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (error instanceof Error && error.name === 'AbortError') {
                        throw new Error('Request timeout');
                    }
                    throw error;
                }
            };

            // 使用很短的超时时间来快速测试
            await expect(requestWithTimeout('/api/slow', 50))
                .rejects.toThrow('Request timeout');
        });
    });
});