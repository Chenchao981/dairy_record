# API 接口文档

## API概览

**Base URL**: `http://localhost:3001/api`  
**协议**: HTTP/HTTPS  
**数据格式**: JSON  
**认证方式**: JWT Bearer Token  

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {}, // 或 []
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE" // 可选
}
```

## 认证相关接口

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "account": "user123",      // 可选，账号
  "email": "user@email.com", // 可选，邮箱  
  "phone": "13800138000",    // 可选，手机号
  "password": "password123", // 必需，密码
  "username": "用户名"        // 必需，显示名称
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "account": "user123",
      "email": "user@email.com", 
      "phone": "13800138000",
      "username": "用户名",
      "role": "user",
      "avatar_url": null,
      "created_at": "2025-08-22T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "loginType": "email",           // "account" | "email" | "phone"
  "loginValue": "user@email.com", // 对应的值
  "password": "password123"       // 密码
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "account": "user123",
      "email": "user@email.com",
      "username": "用户名",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Token验证
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "用户名",
      "role": "user"
    }
  }
}
```

## 情绪管理接口

### 创建情绪记录
```http
POST /api/emotions
Authorization: Bearer {token}
Content-Type: application/json

{
  "mood": "开心",                    // 情绪类型
  "intensity": 8,                   // 强度 1-10
  "activities": ["运动", "听音乐"],    // 活动列表
  "description": "今天心情很好",      // 描述
  "tags": ["运动", "放松"]           // 标签列表
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "emotion": {
      "id": 1,
      "user_id": 1,
      "mood": "开心",
      "intensity": 8,
      "activities": "[\"运动\", \"听音乐\"]",
      "description": "今天心情很好",
      "tags": "[\"运动\", \"放松\"]",
      "created_at": "2025-08-22T12:00:00.000Z",
      "updated_at": "2025-08-22T12:00:00.000Z"
    }
  }
}
```

### 获取情绪记录列表
```http
GET /api/emotions?page=1&limit=20&mood=开心&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**查询参数:**
- `page`: 页码，默认1
- `limit`: 每页数量，默认20，最大100
- `mood`: 情绪类型筛选
- `startDate`: 开始日期 (YYYY-MM-DD)
- `endDate`: 结束日期 (YYYY-MM-DD)
- `minIntensity`: 最小强度
- `maxIntensity`: 最大强度

**响应:**
```json
{
  "success": true,
  "data": {
    "emotions": [
      {
        "id": 1,
        "mood": "开心",
        "intensity": 8,
        "activities": "[\"运动\", \"听音乐\"]",
        "description": "今天心情很好",
        "tags": "[\"运动\", \"放松\"]",
        "created_at": "2025-08-22T12:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 5,
      "pages": 1,
      "limit": 20
    }
  }
}
```

### 获取单条情绪记录
```http
GET /api/emotions/{id}
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "emotion": {
      "id": 1,
      "user_id": 1,
      "mood": "开心",
      "intensity": 8,
      "activities": "[\"运动\", \"听音乐\"]",
      "description": "今天心情很好",
      "tags": "[\"运动\", \"放松\"]",
      "created_at": "2025-08-22T12:00:00.000Z",
      "updated_at": "2025-08-22T12:00:00.000Z"
    }
  }
}
```

### 更新情绪记录
```http
PUT /api/emotions/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "mood": "平静",
  "intensity": 6,
  "activities": ["阅读"],
  "description": "更新后的心情",
  "tags": ["阅读", "安静"]
}
```

### 删除情绪记录
```http
DELETE /api/emotions/{id}
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "message": "情绪记录已删除"
}
```

### 情绪统计分析
```http
GET /api/emotions/stats?period=30&type=mood
Authorization: Bearer {token}
```

**查询参数:**
- `period`: 统计周期（天数），默认30
- `type`: 统计类型 (`mood` | `intensity` | `activities` | `timeline`)

**响应（情绪分布）:**
```json
{
  "success": true,
  "data": {
    "moodDistribution": [
      { "mood": "开心", "count": 15, "percentage": 45.5 },
      { "mood": "平静", "count": 12, "percentage": 36.4 },
      { "mood": "焦虑", "count": 6, "percentage": 18.1 }
    ],
    "averageIntensity": 6.8,
    "totalRecords": 33,
    "period": 30
  }
}
```

## 管理员接口

### 管理员登录
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "email": "admin@example.com",
      "username": "系统管理员",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 获取用户列表
```http
GET /api/admin/users?page=1&limit=20&search=用户名
Authorization: Bearer {admin_token}
```

**查询参数:**
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词（用户名、邮箱、账号）
- `role`: 角色筛选
- `status`: 状态筛选

**响应:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "account": "user123",
        "email": "user@email.com",
        "username": "用户名",
        "role": "user",
        "created_at": "2025-08-22T12:00:00.000Z",
        "emotionCount": 25
      }
    ],
    "pagination": {
      "current": 1,
      "total": 50,
      "pages": 3,
      "limit": 20
    }
  }
}
```

### 获取用户详情
```http
GET /api/admin/users/{id}
Authorization: Bearer {admin_token}
```

### 更新用户信息
```http
PUT /api/admin/users/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "username": "新用户名",
  "email": "newemail@example.com",
  "role": "user",
  "status": "active"
}
```

### 删除用户
```http
DELETE /api/admin/users/{id}
Authorization: Bearer {admin_token}
```

### 系统统计
```http
GET /api/admin/stats
Authorization: Bearer {admin_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 145,
      "newThisMonth": 12
    },
    "emotions": {
      "total": 2450,
      "todayCount": 28,
      "averagePerUser": 16.3
    },
    "systemHealth": {
      "uptime": "15 days",
      "memoryUsage": "245MB",
      "dbSize": "12.5MB"
    }
  }
}
```

## 健康检查接口

### 系统健康状态
```http
GET /api/health
```

**响应:**
```json
{
  "success": true,
  "message": "ok"
}
```

## 错误代码

| 状态码 | 错误类型 | 说明 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权，token无效或过期 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱已存在） |
| 422 | Validation Error | 数据验证失败 |
| 500 | Internal Server Error | 服务器内部错误 |

## 请求限制

- **请求频率**: 每分钟最多100次请求（可配置）
- **请求大小**: 最大10MB
- **Token过期**: 7天（可配置）
- **分页限制**: 每页最多100条记录

## 认证机制

### JWT Token结构
```json
{
  "user": {
    "id": 1,
    "username": "用户名",
    "role": "user"
  },
  "iat": 1692700800,
  "exp": 1693305600
}
```

### 使用方式
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 数据验证规则

### 用户注册
- `account`: 3-20位字母数字，可选
- `email`: 有效邮箱格式，可选
- `phone`: 11位数字，可选
- `password`: 6-50位，必需
- `username`: 1-50位，必需

### 情绪记录
- `mood`: 非空字符串，最大50字符
- `intensity`: 1-10整数
- `activities`: 数组，每项最大50字符
- `description`: 最大1000字符
- `tags`: 数组，每项最大20字符，最多10个

## 示例代码

### JavaScript/TypeScript 客户端
```typescript
// API 服务类
class ApiService {
  private baseUrl = 'http://localhost:3001/api';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.data;
  }

  async login(loginData: LoginData) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async createEmotion(emotionData: EmotionData) {
    return this.request('/emotions', {
      method: 'POST',
      body: JSON.stringify(emotionData),
    });
  }

  async getEmotions(params: QueryParams = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/emotions?${query}`);
  }
}
```