import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User, LoginRequest, RegisterRequest, clearAuth } from '../services/api';

// 认证状态接口
interface AuthState {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

// 创建认证状态store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 用户登录
      login: async (credentials: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
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
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
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
          // 无论API调用是否成功，都清除本地状态
          clearAuth();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // 获取当前用户信息
      getCurrentUser: async (): Promise<void> => {
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
            // token可能已过期，清除认证状态
            clearAuth();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: '用户信息获取失败',
            });
          }
        } catch (error) {
          clearAuth();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: '用户信息获取失败',
          });
        }
      },

      // 清除错误信息
      clearError: () => {
        set({ error: null });
      },

      // 检查认证状态
      checkAuth: async (): Promise<boolean> => {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
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
            // token无效，清除认证状态
            clearAuth();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          clearAuth();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage中的key名称
      partialize: (state) => ({
        // 只持久化用户信息和认证状态，不持久化loading和error
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 导出类型
export type { AuthState };