import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../stores/adminStore';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { admin, isLoading, checkAuth } = useAdminStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('认证检查失败:', error);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [checkAuth]);

  // 显示加载状态
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">验证管理员权限中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，重定向到管理员登录页面
  if (!admin) {
    return (
      <Navigate 
        to="/admin/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
};

export default ProtectedAdminRoute;