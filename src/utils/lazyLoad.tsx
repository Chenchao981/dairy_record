import { lazy, Suspense, ComponentType } from 'react';
import { PageLoading } from '../components/Loading';

// 懒加载组件包装器
export function lazyLoad<T extends ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>
): ComponentType<React.ComponentProps<T>> {
    const Component = lazy(componentImport);

    return function LazyComponent(props: React.ComponentProps<T>) {
        return (
            <Suspense fallback={<PageLoading text="页面加载中..." />}>
                <Component {...props} />
            </Suspense>
        );
    };
}

// 预定义的懒加载组件
export const LazyEmotionAnalysis = lazyLoad(() => import('../pages/EmotionAnalysis'));
export const LazyEmotionHistory = lazyLoad(() => import('../pages/EmotionHistory'));
export const LazyAdminUsers = lazyLoad(() => import('../pages/admin/AdminUsers'));
export const LazyAdminDashboard = lazyLoad(() => import('../pages/admin/AdminDashboard'));
export const LazyAdminSettings = lazyLoad(() => import('../pages/admin/AdminSettings'));