import { useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
    showToast?: boolean;
    customMessage?: string;
    logError?: boolean;
}

interface ApiError extends Error {
    status?: number;
    statusText?: string;
    data?: any;
}

export const useErrorHandler = () => {
    const handleError = useCallback((error: Error | ApiError, options: ErrorHandlerOptions = {}) => {
        const {
            showToast = true,
            customMessage,
            logError = true
        } = options;

        // 记录错误到控制台（开发环境）或发送到错误跟踪服务（生产环境）
        if (logError) {
            console.error('Error caught by useErrorHandler:', error);

            // 在生产环境中，可以发送到错误跟踪服务
            if (process.env.NODE_ENV === 'production') {
                // TODO: 集成错误跟踪服务（如 Sentry）
                // sendErrorToTrackingService(error);
            }
        }

        // 确定要显示的错误消息
        let errorMessage = customMessage;

        if (!errorMessage) {
            if ('status' in error && error.status) {
                // 处理 HTTP 错误
                switch (error.status) {
                    case 400:
                        errorMessage = '请求参数错误，请检查输入信息';
                        break;
                    case 401:
                        errorMessage = '登录已过期，请重新登录';
                        break;
                    case 403:
                        errorMessage = '没有权限执行此操作';
                        break;
                    case 404:
                        errorMessage = '请求的资源不存在';
                        break;
                    case 409:
                        errorMessage = '数据冲突，请刷新后重试';
                        break;
                    case 422:
                        errorMessage = '提交的数据格式不正确';
                        break;
                    case 429:
                        errorMessage = '请求过于频繁，请稍后再试';
                        break;
                    case 500:
                        errorMessage = '服务器内部错误，请稍后重试';
                        break;
                    case 502:
                    case 503:
                    case 504:
                        errorMessage = '服务暂时不可用，请稍后重试';
                        break;
                    default:
                        errorMessage = `请求失败 (${error.status}): ${error.message}`;
                }
            } else if (error.name === 'NetworkError' || error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络设置';
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = '无法连接到服务器，请检查网络连接';
            } else {
                errorMessage = error.message || '发生未知错误';
            }
        }

        // 显示错误提示
        if (showToast && errorMessage) {
            toast.error(errorMessage);
        }

        return errorMessage;
    }, []);

    // 处理异步操作的错误包装器
    const withErrorHandler = useCallback(<T extends (...args: any[]) => Promise<any>>(
        asyncFn: T,
        options?: ErrorHandlerOptions
    ) => {
        return (async (...args: Parameters<T>) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                handleError(error as Error, options);
                throw error; // 重新抛出错误，让调用者决定如何处理
            }
        }) as T;
    }, [handleError]);

    // 处理表单提交错误
    const handleFormError = useCallback((error: Error | ApiError, fieldErrors?: Record<string, string>) => {
        // 处理字段级别的错误
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
            const errorMessages = Object.entries(fieldErrors)
                .map(([field, message]) => `${field}: ${message}`)
                .join('\n');

            toast.error(`表单验证失败:\n${errorMessages}`);
            return;
        }

        // 处理通用错误
        handleError(error, {
            customMessage: '提交失败，请检查输入信息后重试'
        });
    }, [handleError]);

    // 处理网络请求错误
    const handleNetworkError = useCallback((error: Error) => {
        handleError(error, {
            customMessage: '网络请求失败，请检查网络连接后重试'
        });
    }, [handleError]);

    return {
        handleError,
        withErrorHandler,
        handleFormError,
        handleNetworkError
    };
};

// 全局错误处理函数
export const globalErrorHandler = (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Global error:', error, errorInfo);

    // 在生产环境中发送错误到跟踪服务
    if (process.env.NODE_ENV === 'production') {
        // TODO: 集成错误跟踪服务
        // sendErrorToTrackingService(error, errorInfo);
    }

    // 显示用户友好的错误消息
    toast.error('应用出现错误，页面将自动刷新');

    // 严重错误时自动刷新页面（可选）
    // setTimeout(() => {
    //   window.location.reload();
    // }, 3000);
};