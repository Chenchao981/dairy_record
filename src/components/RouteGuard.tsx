import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../hooks/usePermission.tsx';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const location = useLocation();

  // 检查认证状态
  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      checkAuth();
    }
  }, [requireAuth, isAuthenticated, checkAuth]);

  // 如果需要认证但未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 如果需要特定角色但用户角色不匹配
  if (requiredRole && user) {
    const userRole = user.role;
    
    // 管理员可以访问所有页面
    if (userRole !== 'admin' && userRole !== requiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
            <p className="text-gray-600 mb-4">
              您没有权限访问此页面。需要 {requiredRole === 'admin' ? '管理员' : '用户'} 权限。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              当前权限：{userRole === 'admin' ? '管理员' : '普通用户'}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              返回上一页
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// 管理员路由守卫
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard requireAuth={true} requiredRole="admin">
      {children}
    </RouteGuard>
  );
};

// 用户路由守卫（需要登录）
export const UserGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard requireAuth={true}>
      {children}
    </RouteGuard>
  );
};