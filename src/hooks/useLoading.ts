import { create } from 'zustand';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

// 加载状态类型
interface LoadingState {
    isLoading: boolean;
    loadingTasks: Set<string>;
    setLoading: (taskId: string, loading: boolean) => void;
    clearAll: () => void;
}

// 全局加载状态管理
const useLoadingStore = create<LoadingState>((set, get) => ({
    isLoading: false,
    loadingTasks: new Set<string>(),

    setLoading: (taskId: string, loading: boolean) => {
        const { loadingTasks } = get();
        const newTasks = new Set(loadingTasks);

        if (loading) {
            newTasks.add(taskId);
        } else {
            newTasks.delete(taskId);
        }

        set({
            loadingTasks: newTasks,
            isLoading: newTasks.size > 0
        });
    },

    clearAll: () => {
        set({
            loadingTasks: new Set<string>(),
            isLoading: false
        });
    }
}));

// 自定义 Hook 用于管理加载状态
export const useLoading = (taskId?: string) => {
    const { isLoading, loadingTasks, setLoading, clearAll } = useLoadingStore();

    const startLoading = useCallback((id?: string) => {
        const actualId = id || taskId || `task_${Date.now()}`;
        setLoading(actualId, true);
        return actualId;
    }, [taskId, setLoading]);

    const stopLoading = useCallback((id?: string) => {
        const actualId = id || taskId;
        if (actualId) {
            setLoading(actualId, false);
        }
    }, [taskId, setLoading]);

    const isTaskLoading = useCallback((id?: string) => {
        const actualId = id || taskId;
        return actualId ? loadingTasks.has(actualId) : false;
    }, [taskId, loadingTasks]);

    return {
        // 全局加载状态
        isGlobalLoading: isLoading,
        // 当前任务加载状态
        isLoading: taskId ? isTaskLoading() : isLoading,
        // 控制方法
        startLoading,
        stopLoading,
        clearAll,
        // 查询方法
        isTaskLoading,
        // 当前加载任务列表
        loadingTasks: Array.from(loadingTasks)
    };
};

// 用于异步操作的加载包装器
export const useAsyncLoading = () => {
    const { startLoading, stopLoading } = useLoading();

    const withLoading = useCallback(async <T>(
        asyncFn: () => Promise<T>,
        taskId?: string
    ): Promise<T> => {
        const id = startLoading(taskId);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            stopLoading(id);
        }
    }, [startLoading, stopLoading]);

    return { withLoading };
};

// 页面级别的加载状态 Hook
export const usePageLoading = (pageName: string) => {
    const pageTaskId = `page_${pageName}`;
    const loading = useLoading(pageTaskId);

    const setPageLoading = useCallback((isLoading: boolean) => {
        if (isLoading) {
            loading.startLoading();
        } else {
            loading.stopLoading();
        }
    }, [loading]);

    return {
        isPageLoading: loading.isLoading,
        setPageLoading,
        pageTaskId
    };
};

// 表单提交加载状态 Hook
export const useFormLoading = (formName: string) => {
    const formTaskId = `form_${formName}`;
    const loading = useLoading(formTaskId);

    const setFormLoading = useCallback((isLoading: boolean) => {
        if (isLoading) {
            loading.startLoading();
        } else {
            loading.stopLoading();
        }
    }, [loading]);

    return {
        isFormLoading: loading.isLoading,
        setFormLoading,
        formTaskId
    };
};

// API 请求加载状态 Hook
export const useApiLoading = () => {
    const { withLoading } = useAsyncLoading();
    const { handleError } = useErrorHandler();

    const executeWithLoading = useCallback(async <T>(
        apiCall: () => Promise<T>,
        options: {
            taskId?: string;
            errorMessage?: string;
            successMessage?: string;
        } = {}
    ): Promise<T | null> => {
        try {
            const result = await withLoading(apiCall, options.taskId);

            if (options.successMessage) {
                toast.success(options.successMessage);
            }

            return result;
        } catch (error) {
            handleError(error as Error, {
                customMessage: options.errorMessage
            });
            return null;
        }
    }, [withLoading, handleError]);

    return { executeWithLoading };
};

