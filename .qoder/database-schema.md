# 数据库结构设计

## 数据库概览

**数据库类型**: SQLite (通过SQL.js实现)  
**存储方式**: 文件存储 (`data/emotion_app.db`)  
**字符编码**: UTF-8  
**数据库引擎**: SQL.js 1.13.0  

## 数据表结构

### 1. 用户表 (users)

用户基础信息表，存储注册用户的账户信息。

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 用户唯一标识
  account TEXT UNIQUE,                      -- 用户账号（可选）
  email TEXT UNIQUE,                        -- 邮箱地址（可选）
  phone TEXT UNIQUE,                        -- 手机号码（可选）
  password TEXT NOT NULL,                   -- 密码哈希值
  username TEXT NOT NULL,                   -- 用户显示名称
  role TEXT DEFAULT 'user',                 -- 用户角色 (user/admin)
  avatar_url TEXT,                          -- 头像URL（可选）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);
```

**字段说明:**
- `id`: 自增主键，唯一标识每个用户
- `account`: 用户自定义账号，支持字母数字组合，可为空
- `email`: 邮箱地址，用于邮箱登录，可为空
- `phone`: 手机号码，用于手机登录，可为空  
- `password`: 经过bcrypt哈希处理的密码，不存储明文
- `username`: 用户显示名称，必填
- `role`: 用户角色，默认为'user'，管理员为'admin'
- `avatar_url`: 头像图片URL，可为空
- `created_at/updated_at`: 时间戳，自动管理

**约束条件:**
- 账号、邮箱、手机号必须唯一（如果提供）
- 密码和用户名不能为空
- 支持账号、邮箱、手机号中至少一种登录方式

### 2. 管理员表 (admins)

管理员专用表，存储系统管理员信息。

```sql
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 管理员唯一标识
  email TEXT UNIQUE NOT NULL,              -- 管理员邮箱
  password TEXT NOT NULL,                  -- 密码哈希值
  username TEXT NOT NULL,                  -- 管理员显示名称
  role TEXT DEFAULT 'admin',               -- 角色（固定为admin）
  avatar_url TEXT,                         -- 头像URL
  last_login DATETIME,                     -- 最后登录时间
  is_active BOOLEAN DEFAULT 1,             -- 账户状态（1启用/0禁用）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);
```

**字段说明:**
- `id`: 管理员唯一标识
- `email`: 管理员邮箱，必填且唯一
- `password`: 密码哈希值
- `username`: 管理员显示名称
- `role`: 固定为'admin'
- `last_login`: 记录最后登录时间，用于安全审计
- `is_active`: 账户状态，支持禁用管理员账户

### 3. 情绪记录表 (emotions)

核心业务表，存储用户的情绪记录数据。

```sql
CREATE TABLE emotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 记录唯一标识
  user_id INTEGER NOT NULL,                -- 关联用户ID
  mood TEXT NOT NULL,                      -- 情绪类型
  intensity INTEGER NOT NULL               -- 情绪强度
    CHECK(intensity >= 1 AND intensity <= 10),  -- 强度范围约束
  activities TEXT,                         -- 相关活动（JSON格式）
  description TEXT,                        -- 情绪描述
  tags TEXT,                              -- 标签列表（JSON格式）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE  -- 外键约束
);
```

**字段说明:**
- `id`: 情绪记录唯一标识
- `user_id`: 外键，关联到users表的id字段
- `mood`: 情绪类型，如"开心"、"焦虑"、"平静"等
- `intensity`: 情绪强度，1-10级数值，1最低10最高
- `activities`: 相关活动，JSON字符串存储数组
- `description`: 用户对情绪的详细描述
- `tags`: 情绪标签，JSON字符串存储数组
- `created_at/updated_at`: 记录时间戳

**数据示例:**
```json
{
  "id": 1,
  "user_id": 1,
  "mood": "开心",
  "intensity": 8,
  "activities": "[\"运动\", \"听音乐\", \"和朋友聊天\"]",
  "description": "今天天气很好，和朋友一起去公园跑步，心情特别好。",
  "tags": "[\"运动\", \"社交\", \"户外\"]",
  "created_at": "2025-08-22 12:00:00"
}
```

## 数据关系

### 主要关系
1. **users → emotions** (一对多)
   - 一个用户可以有多条情绪记录
   - 外键: `emotions.user_id` → `users.id`
   - 删除策略: CASCADE（删除用户时同步删除其所有情绪记录）

2. **admins** (独立表)
   - 管理员表独立存在，不与其他表建立外键关系
   - 通过业务逻辑管理用户和情绪数据

### 索引策略

**建议创建的索引:**
```sql
-- 用户表索引
CREATE INDEX idx_users_account ON users(account);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- 管理员表索引
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_active ON admins(is_active);

-- 情绪记录表索引
CREATE INDEX idx_emotions_user_id ON emotions(user_id);
CREATE INDEX idx_emotions_mood ON emotions(mood);
CREATE INDEX idx_emotions_intensity ON emotions(intensity);
CREATE INDEX idx_emotions_created_at ON emotions(created_at);
CREATE INDEX idx_emotions_user_date ON emotions(user_id, created_at);
```

## 数据操作

### 常用查询模式

1. **用户认证查询**
```sql
-- 根据邮箱查找用户
SELECT * FROM users WHERE email = ?;

-- 验证管理员登录
SELECT * FROM admins WHERE email = ? AND is_active = 1;
```

2. **情绪数据查询**
```sql
-- 获取用户的情绪记录
SELECT * FROM emotions 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 20;

-- 按日期范围查询
SELECT * FROM emotions 
WHERE user_id = ? 
  AND created_at BETWEEN ? AND ?
ORDER BY created_at DESC;

-- 情绪统计分析
SELECT mood, COUNT(*) as count, AVG(intensity) as avg_intensity
FROM emotions 
WHERE user_id = ?
GROUP BY mood;
```

3. **管理员数据分析**
```sql
-- 用户统计
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users
FROM users;

-- 情绪记录统计
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as active_users,
  AVG(intensity) as avg_intensity
FROM emotions
WHERE created_at >= date('now', '-30 days');
```

## 数据初始化

### 默认数据

1. **默认管理员账户**
```sql
INSERT INTO admins (email, password, username) VALUES 
('admin@example.com', '$2a$10$...', '系统管理员');
```

2. **测试用户账户**
```sql
INSERT INTO users (account, email, password, username) VALUES 
('testuser', 'test@example.com', '$2a$10$...', '测试用户');
```

### 示例数据
- 通过 `api/scripts/addSampleData.ts` 脚本添加
- 包含多样化的情绪记录示例
- 用于开发和演示环境

## 数据备份与迁移

### 备份策略
```javascript
// 导出数据库
const data = db.export();
fs.writeFileSync('backup.db', data);
```

### 数据迁移
- 支持从其他SQLite数据库导入
- JSON格式数据导入导出
- 数据表结构升级机制

## 扩展考虑

### 生产环境改进
1. **真实数据库替换**
   - MySQL/PostgreSQL适配
   - 连接池配置
   - 事务管理优化

2. **性能优化**
   - 查询优化
   - 分页机制
   - 缓存策略

3. **数据安全**
   - 数据加密
   - 备份策略
   - 访问审计

### 功能扩展
1. **新增表结构**
   - 情绪分类表（情绪预设）
   - 用户设置表
   - 操作日志表
   - 通知消息表

2. **关系增强**
   - 用户分组/标签
   - 情绪模板
   - 社交功能支持