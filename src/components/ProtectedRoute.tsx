import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // 是否需要认证，默认为true
  redirectTo?: string; // 重定向路径，默认为'/login'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsChecking(true);
      await checkAuth();
      setIsChecking(false);
    };

    verifyAuth();
  }, [checkAuth]);

  // 正在检查认证状态时显示加载界面
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 需要认证但未登录，重定向到登录页面
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 不需要认证但已登录，可以选择重定向到首页（用于登录/注册页面）
  if (!requireAuth && isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;