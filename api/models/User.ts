import { run, queryAll, query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  account?: string;
  email?: string;
  phone?: string;
  password: string;
  username: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  account?: string;
  email?: string;
  phone?: string;
  password: string;
  username: string;
  role?: string;
  avatar_url?: string;
}

export interface LoginData {
  loginType: 'account' | 'email' | 'phone';
  loginValue: string;
  password: string;
}

export class UserModel {
  // 创建新用户
  static async create(userData: CreateUserData): Promise<User> {
    try {
      // 检查账号、邮箱、手机号是否已存在
      if (userData.account) {
        const existingAccount = await this.findByAccount(userData.account);
        if (existingAccount) {
          throw new Error('账号已被注册');
        }
      }
      if (userData.email) {
        const existingEmail = await this.findByEmail(userData.email);
        if (existingEmail) {
          throw new Error('邮箱已被注册');
        }
      }
      if (userData.phone) {
        const existingPhone = await this.findByPhone(userData.phone);
        if (existingPhone) {
          throw new Error('手机号已被注册');
        }
      }

      // 加密密码
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // 插入新用户
      const sql = `
        INSERT INTO users (account, email, phone, password, username, role, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = run(sql, [
        userData.account || null,
        userData.email || null,
        userData.phone || null,
        hashedPassword,
        userData.username,
        userData.role || 'user',
        userData.avatar_url || null
      ]);

      // 返回创建的用户信息（不包含密码）
      const newUser = await this.findById(result.lastInsertRowid as number);
      if (!newUser) {
        throw new Error('用户创建失败');
      }

      return newUser;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  // 根据ID查找用户
  static async findById(id: number): Promise<User | null> {
    try {
      const sql = 'SELECT id, account, email, phone, username, role, avatar_url, created_at, updated_at FROM users WHERE id = ?';
      const result = query(sql, [id]) as any;
      
      return result && Object.keys(result).length > 0 ? result as User : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 根据账号查找用户
  static async findByAccount(account: string): Promise<User | null> {
    try {
      const sql = 'SELECT id, account, email, phone, username, role, avatar_url, created_at, updated_at FROM users WHERE account = ?';
      const result = query(sql, [account]) as any;
      
      return result && Object.keys(result).length > 0 ? result as User : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const sql = 'SELECT id, account, email, phone, username, role, avatar_url, created_at, updated_at FROM users WHERE email = ?';
      const result = query(sql, [email]) as any;
      
      return result && Object.keys(result).length > 0 ? result as User : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 根据手机号查找用户
  static async findByPhone(phone: string): Promise<User | null> {
    try {
      const sql = 'SELECT id, account, email, phone, username, role, avatar_url, created_at, updated_at FROM users WHERE phone = ?';
      const result = query(sql, [phone]) as any;
      
      return result && Object.keys(result).length > 0 ? result as User : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 根据登录方式查找用户（包含密码，用于登录验证）
  static async findByLoginWithPassword(loginType: 'account' | 'email' | 'phone', loginValue: string): Promise<(User & { password: string }) | null> {
    try {
      let sql = '';
      switch (loginType) {
        case 'account':
          sql = 'SELECT * FROM users WHERE account = ?';
          break;
        case 'email':
          sql = 'SELECT * FROM users WHERE email = ?';
          break;
        case 'phone':
          sql = 'SELECT * FROM users WHERE phone = ?';
          break;
        default:
          throw new Error('不支持的登录方式');
      }
      
      const result = query(sql, [loginValue]) as any;
      
      return result && Object.keys(result).length > 0 ? result as (User & { password: string }) : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 验证用户登录
  static async validateLogin(loginData: LoginData): Promise<User | null> {
    try {
      // 查找用户（包含密码）
      const user = await this.findByLoginWithPassword(loginData.loginType, loginData.loginValue);
      if (!user) {
        return null;
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // 返回用户信息（不包含密码）
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('登录验证失败:', error);
      return null;
    }
  }

  // 更新用户信息
  static async update(id: number, updateData: Partial<CreateUserData>): Promise<User | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      // 构建更新字段
      if (updateData.username) {
        updates.push('username = ?');
        values.push(updateData.username);
      }
      if (updateData.avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(updateData.avatar_url);
      }
      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      }

      if (updates.length === 0) {
        throw new Error('没有要更新的字段');
      }

      // 添加更新时间
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      run(sql, values);

      // 返回更新后的用户信息
      return await this.findById(id);
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async delete(id: number): Promise<boolean> {
    try {
      const sql = 'DELETE FROM users WHERE id = ?';
      run(sql, [id]);
      return true;
    } catch (error) {
      console.error('删除用户失败:', error);
      return false;
    }
  }

  // 获取所有用户（管理功能）
  static async findAll(): Promise<User[]> {
    try {
      const sql = 'SELECT id, account, email, phone, username, role, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC';
      const results = queryAll(sql) as User[];
      return results || [];
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }

  // 检查邮箱是否存在
  static async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      return !!user;
    } catch (error) {
      console.error('检查邮箱失败:', error);
      return false;
    }
  }
}