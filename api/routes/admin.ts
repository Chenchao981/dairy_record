import express from 'express';
import jwt from 'jsonwebtoken';
import { AdminModel, AdminLoginData } from '../models/Admin.js';
import { query, queryAll, run } from '../config/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { email, password }: AdminLoginData = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      });
    }
    
    // 验证管理员身份
    const admin = await AdminModel.authenticate(email, password);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email: admin.email, 
        role: admin.role,
        type: 'admin' // 标识这是管理员token
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        admin,
        token
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 管理员登出
router.post('/logout', (req, res) => {
  // 由于使用JWT，登出主要在前端处理（删除token）
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 验证管理员token中间件
export const verifyAdminToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证token'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 检查是否为管理员token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'token无效或已过期'
    });
  }
};

// 获取当前管理员信息
router.get('/profile', verifyAdminToken, async (req: any, res) => {
  try {
    const adminId = req.admin.adminId;
    
    // 这里应该根据ID查询管理员信息，暂时返回token中的信息
    res.json({
      success: true,
      data: {
        id: adminId,
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取用户统计数据
router.get('/stats/users', verifyAdminToken, async (req: any, res) => {
  try {
    // 获取用户总数
    const totalUsers = query('SELECT COUNT(*) as count FROM users');
    
    // 获取今日新增用户
    const todayUsers = query(`
      SELECT COUNT(*) as count FROM users 
      WHERE DATE(created_at) = DATE('now')
    `);
    
    // 获取本周新增用户
    const weekUsers = query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE('now', '-7 days')
    `);
    
    // 获取本月新增用户
    const monthUsers = query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE('now', '-1 month')
    `);
    
    res.json({
      success: true,
      data: {
        totalUsers: totalUsers?.count || 0,
        todayUsers: todayUsers?.count || 0,
        weekUsers: weekUsers?.count || 0,
        monthUsers: monthUsers?.count || 0
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取用户列表
router.get('/users', verifyAdminToken, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND (status = "active" OR is_active = 1)';
      } else if (status === 'inactive') {
        whereClause += ' AND (status = "inactive" OR is_active = 0)';
      } else if (status === 'banned') {
        whereClause += ' AND status = "banned"';
      }
    }
    
    // 获取用户列表
    const users = queryAll(`
      SELECT 
        id, username, email, account, phone, role, status, is_active, 
        last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    // 获取用户总数
    const totalCount = query(`SELECT COUNT(*) as count FROM users ${whereClause}`, queryParams);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取情绪统计数据
router.get('/stats/emotions', verifyAdminToken, async (req: any, res) => {
  try {
    // 获取情绪记录总数
    const totalEmotions = query('SELECT COUNT(*) as count FROM emotions');
    
    // 获取今日情绪记录
    const todayEmotions = query(`
      SELECT COUNT(*) as count FROM emotions 
      WHERE DATE(created_at) = DATE('now')
    `);
    
    // 获取本周情绪记录
    const weekEmotions = query(`
      SELECT COUNT(*) as count FROM emotions 
      WHERE created_at >= DATE('now', '-7 days')
    `);
    
    // 获取本月情绪记录
    const monthEmotions = query(`
      SELECT COUNT(*) as count FROM emotions 
      WHERE created_at >= DATE('now', '-1 month')
    `);
    
    res.json({
      success: true,
      data: {
        totalEmotions: totalEmotions?.count || 0,
        todayEmotions: todayEmotions?.count || 0,
        weekEmotions: weekEmotions?.count || 0,
        monthEmotions: monthEmotions?.count || 0
      }
    });
  } catch (error) {
    console.error('获取情绪统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取情绪分布数据
router.get('/analytics/emotion-distribution', verifyAdminToken, async (req: any, res) => {
  try {
    // 获取情绪类型分布
    const emotionDistribution = queryAll(`
      SELECT 
        emotion_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM emotion_records), 2) as percentage
      FROM emotion_records 
      GROUP BY emotion_type 
      ORDER BY count DESC
    `);
    
    // 获取最近7天的情绪趋势
    const emotionTrend = queryAll(`
      SELECT 
        DATE(created_at) as date,
        emotion_type,
        COUNT(*) as count
      FROM emotion_records 
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at), emotion_type
      ORDER BY date DESC, count DESC
    `);
    
    res.json({
      success: true,
      data: {
        distribution: emotionDistribution,
        trend: emotionTrend
      }
    });
  } catch (error) {
    console.error('获取情绪分布失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取活动标签统计
router.get('/analytics/activity-tags', verifyAdminToken, async (req: any, res) => {
  try {
    // 获取活动标签统计
    const activityStats = queryAll(`
      SELECT 
        CASE 
          WHEN activities IS NULL OR activities = '' THEN '无活动'
          ELSE activities 
        END as activity,
        COUNT(*) as count
      FROM emotions 
      WHERE activities IS NOT NULL AND activities != ''
      GROUP BY activities
      ORDER BY count DESC
      LIMIT 20
    `);
    
    res.json({
        success: true,
        data: {
          activityStats
        }
      });
  } catch (error) {
    console.error('获取活动标签统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取用户活跃度分析
router.get('/analytics/user-activity', verifyAdminToken, async (req: any, res) => {
  try {
    // 获取最活跃用户（按情绪记录数排序）
    const activeUsers = queryAll(`
      SELECT u.id, u.username, u.email, COUNT(e.id) as emotion_count
      FROM users u
      LEFT JOIN emotions e ON u.id = e.user_id
      GROUP BY u.id, u.username, u.email
      ORDER BY emotion_count DESC
      LIMIT 10
    `);

    // 获取最近30天用户注册趋势
    const userRegistrationTrend = queryAll(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    res.json({
        success: true,
        data: {
          activeUsers,
          userRegistrationTrend
        }
      });
  } catch (error) {
    console.error('获取用户活跃度分析失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取系统概览数据
router.get('/dashboard/overview', verifyAdminToken, async (req: any, res) => {
  try {
    // 获取基础统计数据
    const totalUsers = query('SELECT COUNT(*) as count FROM users');
    const totalEmotions = query('SELECT COUNT(*) as count FROM emotions');
    const todayEmotions = query(`
      SELECT COUNT(*) as count FROM emotions 
      WHERE DATE(created_at) = DATE('now')
    `);

    // 获取最近注册的用户
    const recentUsers = queryAll(`
      SELECT id, username, email, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    // 获取最近活动
    const recentActivities = queryAll(`
      SELECT 
        'user_register' as type,
        u.username as user_name,
        u.created_at as timestamp
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
          totalUsers: totalUsers?.count || 0,
          totalEmotions: totalEmotions?.count || 0,
          todayEmotions: todayEmotions?.count || 0,
          recentUsers,
          recentActivities
        }
    });
  } catch (error) {
    console.error('获取系统概览失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 更新用户信息
router.put('/users/:id', verifyAdminToken, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const { username, email, account, phone, role, status } = req.body;
    
    // 验证必填字段
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: '用户名和邮箱不能为空'
      });
    }
    
    // 检查邮箱是否已被其他用户使用
    const existingUser = query(
      'SELECT id FROM users WHERE email = ? AND id != ?', 
      [email, userId]
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被其他用户使用'
      });
    }
    
    // 更新用户信息
    const result = run(`
      UPDATE users 
      SET username = ?, email = ?, account = ?, phone = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [username, email, account || null, phone || null, role || 'user', status || 'active', userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 删除用户
router.delete('/users/:id', verifyAdminToken, async (req: any, res) => {
  try {
    const userId = req.params.id;
    
    // 先删除用户的情绪记录
    run('DELETE FROM emotions WHERE user_id = ?', [userId]);
    
    // 删除用户
    const result = run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 切换用户状态
router.patch('/users/:id/status', verifyAdminToken, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户状态'
      });
    }
    
    const result = run(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: `用户状态已更新为${status === 'active' ? '正常' : status === 'banned' ? '已禁用' : '非活跃'}`
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取单个用户详情
router.get('/users/:id', verifyAdminToken, async (req: any, res) => {
  try {
    const userId = req.params.id;
    
    const user = query(`
      SELECT 
        id, username, email, account, phone, role, status, 
        created_at, updated_at, last_login
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取用户的情绪记录统计
    const emotionStats = query(`
      SELECT COUNT(*) as total_emotions
      FROM emotions
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        ...user,
        emotion_count: emotionStats?.total_emotions || 0
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;