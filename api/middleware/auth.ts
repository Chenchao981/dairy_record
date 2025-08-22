import { Response, NextFunction } from 'express';
import { AuthRequest } from '../utils/jwt.js';

// 权限检查中间件
export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: '未授权访问，请先登录'
        });
        return;
      }

      const userRole = user.role || 'user';
      
      // 检查用户权限
      if (userRole !== requiredRole && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: '权限不足，无法访问此资源'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('权限检查失败:', error);
      res.status(500).json({
        success: false,
        error: '权限验证失败'
      });
    }
  };
};

// 管理员权限检查中间件
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: '未授权访问，请先登录'
      });
      return;
    }

    const userRole = user.role || 'user';
    
    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: '需要管理员权限才能访问此资源'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('管理员权限检查失败:', error);
    res.status(500).json({
      success: false,
      error: '权限验证失败'
    });
  }
};

// 用户权限检查中间件（普通用户或管理员都可以访问）
export const requireUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: '未授权访问，请先登录'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('用户权限检查失败:', error);
    res.status(500).json({
      success: false,
      error: '权限验证失败'
    });
  }
};

// 检查用户是否可以访问特定用户的资源（本人或管理员）
export const requireOwnerOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    const targetUserId = parseInt(req.params.userId || req.params.id || '0');
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: '未授权访问，请先登录'
      });
      return;
    }

    const userRole = user.role || 'user';
    
    // 管理员可以访问所有资源，用户只能访问自己的资源
    if (userRole !== 'admin' && user.userId !== targetUserId) {
      res.status(403).json({
        success: false,
        error: '权限不足，只能访问自己的资源'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('资源权限检查失败:', error);
    res.status(500).json({
      success: false,
      error: '权限验证失败'
    });
  }
};