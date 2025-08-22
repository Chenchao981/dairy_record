// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any[];
}

// 用户相关接口
export interface User {
  id: number;
  account?: string;
  email?: string;
  phone?: string;
  username: string;
  role?: string;
  avatar_url?: string;
  created_at: string;
}

export interface LoginRequest {
  loginType: 'account' | 'email' | 'phone';
  loginValue: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  avatar_url?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

// HTTP请求工具函数
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // 从localStorage获取token
    this.token = localStorage.getItem('auth_token');
  }

  // 设置认证token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // 获取请求头
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // GET请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 创建API客户端实例
const apiClient = new ApiClient(API_BASE_URL);

// 认证相关API
export const authApi = {
  // 用户注册
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // 注册成功后自动设置token
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  },

  // 用户登录
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);

    // 登录成功后自动设置token
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  },

  // 用户注销
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');

    // 注销后清除token
    apiClient.setToken(null);

    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.get<{ user: User }>('/auth/me');
  },

  // 检查token是否有效
  validateToken: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.success;
    } catch (error) {
      return false;
    }
  },
};

// 导出API客户端实例（用于其他模块设置token等）
export { apiClient };

// 工具函数：检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// 工具函数：获取存储的token
export const getStoredToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// 工具函数：清除认证信息
export const clearAuth = (): void => {
  apiClient.setToken(null);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user_data');
};

// 情绪记录相关接口
export interface EmotionRecord {
  id?: number;
  user_id: number;
  mood: string;
  intensity: number;
  activities: string[];
  description?: string;
  created_at?: string;
}

export interface CreateEmotionRequest {
  mood: string;
  intensity: number;
  activities: string[];
  description?: string;
}

// 情绪记录相关API
export const emotionApi = {
  // 创建情绪记录
  create: async (data: CreateEmotionRequest): Promise<ApiResponse<EmotionRecord>> => {
    return apiClient.post<EmotionRecord>('/emotions', data);
  },

  // 获取用户的情绪记录列表
  getList: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<ApiResponse<{ records: EmotionRecord[]; total: number }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/emotions?${queryString}` : '/emotions';

    return apiClient.get<{ records: EmotionRecord[]; total: number }>(endpoint);
  },

  // 获取单个情绪记录详情
  getById: async (id: number): Promise<ApiResponse<EmotionRecord>> => {
    return apiClient.get<EmotionRecord>(`/emotions/${id}`);
  },

  // 更新情绪记录
  update: async (id: number, data: Partial<CreateEmotionRequest>): Promise<ApiResponse<EmotionRecord>> => {
    return apiClient.put<EmotionRecord>(`/emotions/${id}`, data);
  },

  // 删除情绪记录
  delete: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/emotions/${id}`);
  },

  // 获取情绪统计数据
  getStats: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/emotions/stats?${queryString}` : '/emotions/stats';

    return apiClient.get(endpoint);
  },
};