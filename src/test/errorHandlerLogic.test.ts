import { describe, it, expect, vi } from 'vitest';

// 测试错误处理逻辑
describe('Error Handler Logic', () => {
    const mockToast = {
        error: vi.fn(),
        success: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Error Message Processing', () => {
        it('应该能够提取错误消息', () => {
            const getErrorMessage = (error: Error | string, defaultMessage?: string): string => {
                if (typeof error === 'string') {
                    return error;
                }

                if (error instanceof Error) {
                    return error.message || defaultMessage || '发生了未知错误';
                }

                return defaultMessage || '发生了未知错误';
            };

            expect(getErrorMessage(new Error('测试错误'))).toBe('测试错误');
            expect(getErrorMessage(new Error())).toBe('发生了未知错误');
            expect(getErrorMessage(new Error(''), '自定义默认消息')).toBe('自定义默认消息');
            expect(getErrorMessage('字符串错误')).toBe('字符串错误');
        });

        it('应该能够识别网络错误类型', () => {
            const identifyNetworkError = (error: Error): string => {
                const message = error.message.toLowerCase();

                if (error.name === 'NetworkError' || message.includes('network')) {
                    return '网络连接失败，请检查您的网络设置';
                }

                if (message.includes('timeout')) {
                    return '请求超时，请稍后重试';
                }

                if (message.includes('server') || message.includes('internal')) {
                    return '服务器错误，请稍后重试';
                }

                return '网络请求失败，请稍后重试';
            };

            const networkError = new Error('Network Error');
            networkError.name = 'NetworkError';
            expect(identifyNetworkError(networkError)).toBe('网络连接失败，请检查您的网络设置');

            const timeoutError = new Error('Request timeout');
            expect(identifyNetworkError(timeoutError)).toBe('请求超时，请稍后重试');

            const serverError = new Error('Internal Server Error');
            expect(identifyNetworkError(serverError)).toBe('服务器错误，请稍后重试');

            const genericError = new Error('Unknown error');
            expect(identifyNetworkError(genericError)).toBe('网络请求失败，请稍后重试');
        });

        it('应该能够识别表单验证错误', () => {
            const identifyFormError = (error: Error): string => {
                if (error.name === 'ValidationError') {
                    return '表单验证失败，请检查输入内容';
                }

                return error.message || '表单提交失败';
            };

            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            expect(identifyFormError(validationError)).toBe('表单验证失败，请检查输入内容');

            const fieldError = new Error('邮箱格式不正确');
            expect(identifyFormError(fieldError)).toBe('邮箱格式不正确');
        });

        it('应该能够处理API错误状态码', () => {
            const handleApiError = (error: { status?: number; message?: string }): string => {
                switch (error.status) {
                    case 401:
                        return '登录已过期，请重新登录';
                    case 403:
                        return '您没有权限执行此操作';
                    case 404:
                        return '请求的资源不存在';
                    case 500:
                        return '服务器内部错误，请稍后重试';
                    default:
                        return error.message || 'API请求失败';
                }
            };

            expect(handleApiError({ status: 401 })).toBe('登录已过期，请重新登录');
            expect(handleApiError({ status: 403 })).toBe('您没有权限执行此操作');
            expect(handleApiError({ status: 404 })).toBe('请求的资源不存在');
            expect(handleApiError({ status: 500 })).toBe('服务器内部错误，请稍后重试');
            expect(handleApiError({ status: 418, message: "I'm a teapot" })).toBe("I'm a teapot");
            expect(handleApiError({ message: '自定义错误' })).toBe('自定义错误');
        });
    });

    describe('Error Logging', () => {
        it('应该能够记录错误信息', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const logError = (context: string, error: Error) => {
                console.error(`${context}:`, error);
            };

            const testError = new Error('Test error');
            logError('Test Context', testError);

            expect(consoleSpy).toHaveBeenCalledWith('Test Context:', testError);
        });

        it('应该能够过滤无关的控制台警告', () => {
            const originalConsoleError = console.error;
            const filteredConsole = vi.fn();

            const setupFilteredConsole = () => {
                console.error = (...args: any[]) => {
                    if (args[0] && typeof args[0] === 'string' &&
                        !args[0].includes('Warning:') &&
                        !args[0].includes('ReactDOMTestUtils')) {
                        filteredConsole(...args);
                    }
                };
            };

            setupFilteredConsole();

            console.error('Warning: Something happened'); // 应该被过滤
            console.error('ReactDOMTestUtils: Test warning'); // 应该被过滤
            console.error('Real error message'); // 不应该被过滤

            expect(filteredConsole).toHaveBeenCalledTimes(1);
            expect(filteredConsole).toHaveBeenCalledWith('Real error message');

            // 恢复原始console.error
            console.error = originalConsoleError;
        });
    });

    describe('Toast Integration', () => {
        it('应该能够显示错误通知', () => {
            const showError = (message: string) => {
                mockToast.error(message);
            };

            showError('测试错误消息');
            expect(mockToast.error).toHaveBeenCalledWith('测试错误消息');
        });

        it('应该能够显示成功通知', () => {
            const showSuccess = (message: string) => {
                mockToast.success(message);
            };

            showSuccess('操作成功');
            expect(mockToast.success).toHaveBeenCalledWith('操作成功');
        });
    });
});