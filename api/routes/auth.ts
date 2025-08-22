/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import { UserModel, type CreateUserData, type LoginData } from '../models/User.js';
import { generateToken, authenticateToken, type AuthRequest } from '../utils/jwt.js';
import { body, validationResult } from 'express-validator';


const router = Router();

/**
 * User Register
 * POST /api/auth/register
 */
router.post('/register', [
  // 输入验证
  body('account')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('账号长度应在3-20位之间'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请提供有效的手机号'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6位'),
  body('username')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度应在2-20位之间'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 检查验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入数据验证失败',
        details: errors.array()
      });
      return;
    }

    const { account, email, phone, password, username, avatar_url, role } = req.body as CreateUserData & { avatar_url?: string };

    // 创建用户
    const newUser = await UserModel.create({
      account,
      email,
      phone,
      password,
      username,
      role: role || 'user',
      avatar_url
    });

    // 生成JWT token
    const token = generateToken({
      userId: newUser.id!,
      email: newUser.email || '',
      username: newUser.username,
      role: newUser.role || 'user'
    });

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        user: {
          id: newUser.id,
          account: newUser.account,
          email: newUser.email,
          phone: newUser.phone,
          username: newUser.username,
          role: newUser.role,
          avatar_url: newUser.avatar_url,
          created_at: newUser.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('账号已被注册')) {
        res.status(409).json({
          success: false,
          error: '账号已被注册'
        });
      } else if (error.message.includes('邮箱已被注册')) {
        res.status(409).json({
          success: false,
          error: '邮箱已被注册'
        });
      } else if (error.message.includes('手机号已被注册')) {
        res.status(409).json({
          success: false,
          error: '手机号已被注册'
        });
      } else {
        res.status(500).json({
          success: false,
          error: '注册失败，请稍后重试'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: '注册失败，请稍后重试'
      });
    }
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', [
  // 输入验证
  body('loginType')
    .isIn(['account', 'email', 'phone'])
    .withMessage('登录类型必须是 account、email 或 phone'),
  body('loginValue')
    .notEmpty()
    .withMessage('登录凭证不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 检查验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入数据验证失败',
        details: errors.array()
      });
      return;
    }

    const { loginType, loginValue, password } = req.body as LoginData;

    // 验证用户登录
    const user = await UserModel.validateLogin({ loginType, loginValue, password });
    if (!user) {
      res.status(401).json({
        success: false,
        error: '登录凭证或密码错误'
      });
      return;
    }

    // 生成JWT token
    const token = generateToken({
      userId: user.id!,
      email: user.email || '',
      username: user.username,
      role: user.role || 'user'
    });

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          account: user.account,
          email: user.email,
          phone: user.phone,
          username: user.username,
          role: user.role,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试'
    });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // JWT是无状态的，注销主要在前端处理（删除token）
    // 这里可以记录注销日志或进行其他清理工作
    
    res.status(200).json({
      success: true,
      message: '注销成功'
    });
  } catch (error) {
    console.error('用户注销失败:', error);
    res.status(500).json({
      success: false,
      error: '注销失败，请稍后重试'
    });
  }
});

/**
 * Get Current User Info
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户信息无效'
      });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          account: user.account,
          email: user.email,
          phone: user.phone,
          username: user.username,
          role: user.role,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

export default router;