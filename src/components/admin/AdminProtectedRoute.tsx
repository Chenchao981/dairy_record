import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, admin } = useAdminStore();
  const location = useLocation();

  if (!isAuthenticated || !admin) {
    // 重定向到管理员登录页面，并保存当前路径
    return (
      <Navigate 
        to="/admin/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;