import bcrypt from 'bcryptjs';
import { adminQueries } from '../config/database.js';

export interface Admin {
  id: number;
  email: string;
  password: string;
  username: string;
  role: string;
  avatar_url?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminResponse {
  id: number;
  email: string;
  username: string;
  role: string;
  avatar_url?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
}

export class AdminModel {
  // 管理员登录验证
  static async authenticate(email: string, password: string): Promise<AdminResponse | null> {
    try {
      const admin = adminQueries.findByEmail(email) as Admin;
      
      if (!admin) {
        return null;
      }
      
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return null;
      }
      
      // 更新最后登录时间
      adminQueries.updateLastLogin(admin.id);
      
      // 返回管理员信息（不包含密码）
      return {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        avatar_url: admin.avatar_url,
        last_login: admin.last_login,
        is_active: admin.is_active,
        created_at: admin.created_at
      };
    } catch (error) {
      console.error('管理员认证失败:', error);
      throw error;
    }
  }
  
  // 根据ID获取管理员信息
  static async findById(id: number): Promise<AdminResponse | null> {
    try {
      const admin = adminQueries.findById(id);
      if (!admin) {
        return null;
      }
      
      // 返回不包含密码的管理员信息
      const { password, ...adminResponse } = admin;
      return adminResponse as AdminResponse;
    } catch (error) {
      console.error('查找管理员失败:', error);
      throw error;
    }
  }
  
  // 获取所有管理员列表
  static async getAllAdmins(): Promise<AdminResponse[]> {
    try {
      const admins = adminQueries.getAllAdmins() as Admin[];
      return admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        avatar_url: admin.avatar_url,
        last_login: admin.last_login,
        is_active: admin.is_active,
        created_at: admin.created_at
      }));
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      throw error;
    }
  }
}