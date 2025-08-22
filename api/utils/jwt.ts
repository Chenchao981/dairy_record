import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// JWT密钥，生产环境应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// 生成JWT token
export const generateToken = (payload: JwtPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'emotion-app',
      audience: 'emotion-app-users'
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

// 验证JWT token
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'emotion-app',
      audience: 'emotion-app-users'
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token无效');
    } else {
      throw new Error('Token验证失败');
    }
  }
};

// JWT认证中间件
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: '访问被拒绝，需要提供认证token'
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    res.status(403).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token验证失败'
    });
  }
};

// 可选的JWT认证中间件（不强制要求token）
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // 可选认证，token无效时不阻止请求
        console.warn('可选认证token无效:', error);
      }
    }

    next();
  } catch (error) {
    // 可选认证，出错时不阻止请求
    console.warn('可选认证处理失败:', error);
    next();
  }
};

// 刷新token
export const refreshToken = (oldToken: string): string => {
  try {
    // 验证旧token（即使过期也要能解析）
    const decoded = jwt.decode(oldToken) as JwtPayload;
    
    if (!decoded || !decoded.userId) {
      throw new Error('无效的token');
    }

    // 生成新token
    const newPayload: JwtPayload = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role
    };

    return generateToken(newPayload);
  } catch (error) {
    console.error('刷新token失败:', error);
    throw new Error('Token刷新失败');
  }
};

// 从token中提取用户信息（不验证有效性）
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
};

// 检查token是否即将过期（剩余时间少于1小时）
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    
    // 如果剩余时间少于1小时（3600秒），认为即将过期
    return timeUntilExpiry < 3600;
  } catch (error) {
    console.error('检查token过期时间失败:', error);
    return true;
  }
};