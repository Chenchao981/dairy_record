import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../../useErrorHandler';

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    }
}));

// Mock console.error
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

describe('useErrorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('handleError', () => {
        it('应该处理一般错误并显示错误消息', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const error = new Error('测试错误');

            act(() => {
                result.current.handleError(error);
            });

            expect(toast.error).toHaveBeenCalledWith('测试错误');
            expect(consoleSpy).toHaveBeenCalledWith('Error:', error);
        });

        it('应该处理没有消息的错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const error = new Error();

            act(() => {
                result.current.handleError(error);
            });

            expect(toast.error).toHaveBeenCalledWith('发生了未知错误');
        });

        it('应该处理自定义错误消息', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const error = new Error('原始错误');

            act(() => {
                result.current.handleError(error, '自定义错误消息');
            });

            expect(toast.error).toHaveBeenCalledWith('自定义错误消息');
            expect(consoleSpy).toHaveBeenCalledWith('Error:', error);
        });
    });

    describe('handleNetworkError', () => {
        it('应该处理网络连接错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const networkError = new Error('Network Error');
            networkError.name = 'NetworkError';

            act(() => {
                result.current.handleNetworkError(networkError);
            });

            expect(toast.error).toHaveBeenCalledWith('网络连接失败，请检查您的网络设置');
            expect(consoleSpy).toHaveBeenCalledWith('Network Error:', networkError);
        });

        it('应该处理超时错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const timeoutError = new Error('timeout');

            act(() => {
                result.current.handleNetworkError(timeoutError);
            });

            expect(toast.error).toHaveBeenCalledWith('请求超时，请稍后重试');
        });

        it('应该处理服务器错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const serverError = new Error('Internal Server Error');

            act(() => {
                result.current.handleNetworkError(serverError);
            });

            expect(toast.error).toHaveBeenCalledWith('服务器错误，请稍后重试');
        });

        it('应该处理一般网络错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const generalError = new Error('一般错误');

            act(() => {
                result.current.handleNetworkError(generalError);
            });

            expect(toast.error).toHaveBeenCalledWith('网络请求失败，请稍后重试');
        });
    });

    describe('handleFormError', () => {
        it('应该处理验证错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';

            act(() => {
                result.current.handleFormError(validationError);
            });

            expect(toast.error).toHaveBeenCalledWith('表单验证失败，请检查输入内容');
            expect(consoleSpy).toHaveBeenCalledWith('Form Error:', validationError);
        });

        it('应该处理字段错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const fieldError = new Error('邮箱格式不正确');

            act(() => {
                result.current.handleFormError(fieldError);
            });

            expect(toast.error).toHaveBeenCalledWith('邮箱格式不正确');
        });
    });

    describe('handleApiError', () => {
        it('应该处理401未授权错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const authError = { status: 401, message: 'Unauthorized' };

            act(() => {
                result.current.handleApiError(authError);
            });

            expect(toast.error).toHaveBeenCalledWith('登录已过期，请重新登录');
        });

        it('应该处理403权限错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const permissionError = { status: 403, message: 'Forbidden' };

            act(() => {
                result.current.handleApiError(permissionError);
            });

            expect(toast.error).toHaveBeenCalledWith('您没有权限执行此操作');
        });

        it('应该处理404未找到错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const notFoundError = { status: 404, message: 'Not Found' };

            act(() => {
                result.current.handleApiError(notFoundError);
            });

            expect(toast.error).toHaveBeenCalledWith('请求的资源不存在');
        });

        it('应该处理500服务器错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const serverError = { status: 500, message: 'Internal Server Error' };

            act(() => {
                result.current.handleApiError(serverError);
            });

            expect(toast.error).toHaveBeenCalledWith('服务器内部错误，请稍后重试');
        });

        it('应该处理其他状态码错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const otherError = { status: 418, message: "I'm a teapot" };

            act(() => {
                result.current.handleApiError(otherError);
            });

            expect(toast.error).toHaveBeenCalledWith("I'm a teapot");
        });

        it('应该处理没有状态码的错误', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            const unknownError = { message: '未知API错误' };

            act(() => {
                result.current.handleApiError(unknownError);
            });

            expect(toast.error).toHaveBeenCalledWith('未知API错误');
        });
    });

    describe('showSuccess', () => {
        it('应该显示成功消息', () => {
            const { toast } = require('sonner');
            const { result } = renderHook(() => useErrorHandler());

            act(() => {
                result.current.showSuccess('操作成功');
            });

            expect(toast.success).toHaveBeenCalledWith('操作成功');
        });
    });
});