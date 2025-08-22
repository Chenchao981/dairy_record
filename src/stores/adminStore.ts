import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: number;
  email: string;
  username: string;
  role: string;
  avatar_url?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
}

interface AdminState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setAdmin: (admin: Admin) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || '登录失败');
          }

          const { admin, token } = data.data;
          
          set({
            admin,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();
        
        try {
          // 调用后端登出接口
          if (token) {
            await fetch(`${API_BASE_URL}/admin/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (error) {
          console.error('登出请求失败:', error);
        } finally {
          // 无论后端请求是否成功，都清除本地状态
          set({
            admin: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isAuthenticated: false, admin: null });
          return;
        }
        
        try {
          const response = await fetch(`${API_BASE_URL}/admin/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error('Token验证失败');
          }
          
          const data = await response.json();
          set({
            admin: data.data,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('认证检查失败:', error);
          set({
            admin: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      setAdmin: (admin: Admin) => {
        set({ admin });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },

      clearAuth: () => {
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 管理员API请求工具函数
export const adminApi = {
  // 获取认证头
  getAuthHeaders: () => {
    const { token } = useAdminStore.getState();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  },

  // 获取用户统计数据
  getUserStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats/users`, {
      headers: adminApi.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('获取用户统计失败');
    }
    
    return response.json();
  },

  // 获取用户列表
  getUsers: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const { page = 1, limit = 10, search, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
    });
    
    const response = await fetch(
      `${API_BASE_URL}/admin/users?${queryParams}`,
      {
        headers: adminApi.getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error('获取用户列表失败');
    }
    
    return response.json();
  },

  // 获取管理员个人信息
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      headers: adminApi.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('获取管理员信息失败');
    }
    
    return response.json();
  },

  // 更新用户信息
  updateUser: async (userId: number, userData: {
    username: string;
    email: string;
    account?: string;
    phone?: string;
    role: string;
    status: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: adminApi.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新用户信息失败');
    }
    
    return response.json();
  },

  // 删除用户
  deleteUser: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: adminApi.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除用户失败');
    }
    
    return response.json();
  },

  // 切换用户状态
  updateUserStatus: async (userId: number, status: 'active' | 'inactive' | 'banned') => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: adminApi.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新用户状态失败');
    }
    
    return response.json();
  },

  // 获取单个用户详情
  getUser: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: adminApi.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取用户详情失败');
    }
    
    return response.json();
  },
};