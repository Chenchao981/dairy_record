import { create } from 'zustand';
import { authApi, User, LoginRequest, RegisterRequest, clearAuth } from '../services/api';
import AuthPersistence from '../utils/authPersistence';
import { toast } from 'sonner';

// 认证状态接口
interface AuthState {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
  tokenExpiry: Date | null;

  // 操作方法
  login: (credentials: LoginRequest, rememberMe?: boolean) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;
}

// 创建认证状态store
export const useAuthStore = create<AuthState>()((set, get) => {
  // 监听 token 刷新事件
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:token-refresh-needed', async () => {
      const state = get();
      if (state.isAuthenticated) {
        await state.refreshToken();
      }
    });

    window.addEventListener('auth:state-changed', (event: any) => {
      const authSummary = event.detail;
      set({
        isAuthenticated: authSummary.isAuthenticated,
        user: authSummary.user,
        tokenExpiry: authSummary.tokenExpiry,
        rememberMe: authSummary.rememberMe
      });
    });
  }

  return {
    // 初始状态
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    rememberMe: false,
    tokenExpiry: null,

    // 初始化认证状态
    initializeAuth: async (): Promise<void> => {
      set({ isLoading: true, error: null });

      try {
        const authData = AuthPersistence.getAuthData();

        if (authData.token && !authData.isExpired && authData.user) {
          // 验证会话完整性
          if (AuthPersistence.validateSession()) {
            set({
              user: authData.user,
              isAuthenticated: true,
              rememberMe: authData.rememberMe,
              tokenExpiry: authData.isExpired ? null : new Date(Date.now() + 3600 * 1000),
              isLoading: false
            });

            // 启动自动刷新
            AuthPersistence.startAutoRefresh();

            // 如果 token 即将过期，尝试刷新
            if (AuthPersistence.isTokenNearExpiry()) {
              await get().refreshToken();
            }
          } else {
            AuthPersistence.clearAuthData();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        AuthPersistence.clearAuthData();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    },

    // 用户登录
    login: async (credentials: LoginRequest, rememberMe: boolean = false): Promise<boolean> => {
      set({ isLoading: true, error: null });

      try {
        const response = await authApi.login(credentials);

        if (response.success && response.data) {
          const { user, token, refreshToken, expiresIn } = response.data;

          // 使用新的持久化机制保存认证信息
          AuthPersistence.saveAuthData({
            token,
            refreshToken,
            expiresIn: expiresIn || 3600, // 默认1小时
            user,
            rememberMe
          });

          AuthPersistence.saveDeviceFingerprint();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            rememberMe,
            tokenExpiry: new Date(Date.now() + (expiresIn || 3600) * 1000)
          });

          toast.success('登录成功！');
          return true;
        } else {
          set({
            error: response.error || '登录失败',
            isLoading: false,
          });
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登录失败';
        set({
          error: errorMessage,
          isLoading: false,
        });
        return false;
      }
    },

    // 用户注册
    register: async (userData: RegisterRequest): Promise<boolean> => {
      set({ isLoading: true, error: null });

      try {
        const response = await authApi.register(userData);

        if (response.success) {
          // 注册成功，但不自动登录，需要验证邮箱
          set({
            isLoading: false,
            error: null,
          });

          toast.success('注册成功！请查收验证邮件');
          return true;
        } else {
          set({
            error: response.error || '注册失败',
            isLoading: false,
          });
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '注册失败';
        set({
          error: errorMessage,
          isLoading: false,
        });
        return false;
      }
    },

    // 用户注销
    logout: async (): Promise<void> => {
      set({ isLoading: true });

      try {
        await authApi.logout();
      } catch (error) {
        console.error('注销请求失败:', error);
      } finally {
        // 清除所有认证信息
        clearAuth();
        AuthPersistence.clearAuthData();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          rememberMe: false,
          tokenExpiry: null
        });

        toast.success('已安全退出');
      }
    },

    // 获取当前用户信息
    getCurrentUser: async (): Promise<void> => {
      const token = AuthPersistence.getToken();

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: '未登录',
        });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const response = await authApi.getCurrentUser();

        if (response.success && response.data) {
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // token可能已过期，尝试刷新
          const refreshSuccess = await get().refreshToken();

          if (!refreshSuccess) {
            AuthPersistence.clearAuthData();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: '认证已过期，请重新登录',
            });
          }
        }
      } catch (error) {
        AuthPersistence.clearAuthData();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: '获取用户信息失败',
        });
      }
    },

    // 刷新 Token
    refreshToken: async (): Promise<boolean> => {
      const authData = AuthPersistence.getAuthData();

      if (!authData.refreshToken) {
        return false;
      }

      try {
        // TODO: 实现 token 刷新 API
        // const response = await authApi.refreshToken(authData.refreshToken);

        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 模拟成功响应
        const newToken = 'new_' + Date.now();
        const expiresIn = 3600;

        AuthPersistence.updateToken(newToken, expiresIn);

        set({
          tokenExpiry: new Date(Date.now() + expiresIn * 1000)
        });

        console.log('Token 刷新成功');
        return true;
      } catch (error) {
        console.error('Token 刷新失败:', error);

        // 刷新失败，清除认证状态
        AuthPersistence.clearAuthData();
        set({
          user: null,
          isAuthenticated: false,
          error: '登录已过期，请重新登录'
        });

        return false;
      }
    },

    // 清除错误信息
    clearError: () => {
      set({ error: null });
    },

    // 检查认证状态
    checkAuth: async (): Promise<boolean> => {
      const authData = AuthPersistence.getAuthData();

      if (!authData.token || authData.isExpired) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }

      set({ isLoading: true });

      try {
        const isValid = await authApi.validateToken();

        if (isValid) {
          // token有效，获取用户信息
          await get().getCurrentUser();
          return true;
        } else {
          // 尝试刷新 token
          const refreshSuccess = await get().refreshToken();

          if (refreshSuccess) {
            await get().getCurrentUser();
            return true;
          } else {
            AuthPersistence.clearAuthData();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }
        }
      } catch (error) {
        AuthPersistence.clearAuthData();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }
    },
  };
});

// 应用启动时自动初始化认证状态
if (typeof window !== 'undefined') {
  // 确保在 DOM 加载后初始化
  document.addEventListener('DOMContentLoaded', () => {
    useAuthStore.getState().initializeAuth();
  });

  // 如果 DOM 已经加载，立即初始化
  if (document.readyState === 'loading') {
    useAuthStore.getState().initializeAuth();
  }
}

// 导出类型
export type { AuthState };