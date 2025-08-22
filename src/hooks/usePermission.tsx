import React from 'react';
import { useAuthStore } from '../stores/authStore';

// 权限类型定义
export type UserRole = 'admin' | 'user';

// 权限检查Hook
export const usePermission = () => {
  const { user, isAuthenticated } = useAuthStore();

  // 检查是否有特定角色权限
  const hasRole = (role: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.role === role;
  };

  // 检查是否是管理员
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  // 检查是否是普通用户
  const isUser = (): boolean => {
    return hasRole('user');
  };

  // 检查是否已登录
  const isLoggedIn = (): boolean => {
    return isAuthenticated && !!user;
  };

  // 检查是否有访问权限（管理员或指定角色）
  const canAccess = (requiredRole?: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;

    // 如果没有指定角色要求，只需要登录即可
    if (!requiredRole) return true;

    // 管理员可以访问所有内容
    if (user.role === 'admin') return true;

    // 检查是否有指定角色
    return user.role === requiredRole;
  };

  // 获取当前用户角色
  const getCurrentRole = (): UserRole | null => {
    if (!isAuthenticated || !user || !user.role) return null;
    return user.role as UserRole;
  };

  // 获取用户显示名称
  const getUserDisplayName = (): string => {
    if (!user) return '';
    return user.username || user.account || user.email || '未知用户';
  };

  return {
    hasRole,
    isAdmin,
    isUser,
    isLoggedIn,
    canAccess,
    getCurrentRole,
    getUserDisplayName,
    user,
    isAuthenticated,
  };
};

// 权限守卫组件Props
interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// 权限守卫组件
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole,
  fallback = <div className="text-center text-gray-500 py-8"> 您没有权限访问此内容 </div>,
}) => {
  const { canAccess } = usePermission();

  if (!canAccess(requiredRole)) {
    return <>{ fallback } </>;
  }

  return <>{ children } </>;
};