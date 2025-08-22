# Dairy Record 快速使用手册

## 项目概述
Dairy Record 是一个基于 React + Express 的情绪记录和分析应用，支持用户情绪数据的记录、可视化分析以及管理员功能。

## 环境要求
- Node.js 14+ (推荐 18+)
- npm 或 yarn

## 快速启动

### 1. 安装依赖
```bash
# 克隆项目后，进入项目目录
cd dairy_record

# 安装所有依赖
npm install
```

### 2. 启动项目
```bash
# 方式一：同时启动前后端（推荐）
npm run dev

# 方式二：分别启动
# 启动前端开发服务器（端口 3000）
npm run client:dev

# 启动后端服务器（端口 3001）
npm run server:dev
```

### 3. 访问应用
- 前端地址：http://localhost:3000
- 后端API地址：http://localhost:3001

## 用户注册与登录

### 普通用户注册
1. 访问 http://localhost:3000
2. 点击"注册"按钮
3. 填写注册信息：
   - 用户名（账号）
   - 邮箱
   - 密码（最少6位）
   - 昵称

### 普通用户登录
1. 在登录页面输入：
   - 登录方式：账号/邮箱
   - 密码
2. 点击"登录"完成认证

### 管理员登录
1. 访问 http://localhost:3000/admin/login
2. 使用管理员凭证登录：
   ```
   邮箱：admin@example.com
   密码：admin123
   ```

## 核心功能使用

### 情绪记录
1. 登录后进入主页
2. 点击"记录情绪"
3. 选择或输入：
   - 情绪类型（开心、悲伤、愤怒等）
   - 情绪强度（1-10）
   - 相关活动
   - 描述和标签
4. 保存记录

### 情绪分析
1. 在导航栏点击"情绪分析"
2. 查看情绪趋势图表
3. 筛选时间范围（7天、30天、90天）
4. 查看情绪分布和统计数据

### 历史记录
1. 点击"情绪历史"
2. 浏览过往情绪记录
3. 支持按日期筛选
4. 支持编辑和删除记录

### 数据导出
1. 在分析页面点击"导出数据"
2. 选择导出格式（JSON/CSV）
3. 选择时间范围
4. 下载数据文件

## 管理员功能

### 用户管理
- 查看所有注册用户
- 查看用户详细信息
- 管理用户状态

### 数据统计
- 查看系统整体数据统计
- 用户活跃度分析
- 情绪数据概览

### 系统设置
- 系统配置管理
- 数据备份和恢复

## API 使用示例

### 用户注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "account": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "username": "测试用户"
  }'
```

### 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginType": "account",
    "loginValue": "testuser",
    "password": "password123"
  }'
```

### 创建情绪记录（需要JWT Token）
```bash
curl -X POST http://localhost:3001/api/emotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mood": "happy",
    "intensity": 7,
    "activities": ["reading", "walking"],
    "description": "今天感觉不错",
    "tags": ["positive"]
  }'
```

## 故障排除

### 常见问题

**1. 端口占用错误**
- 检查端口 3000 和 3001 是否被占用
- 使用 `lsof -i :3000` 查看端口占用情况
- 修改 vite.config.ts 中的端口配置

**2. 数据库初始化失败**
- 删除项目中的 `.db` 文件重新初始化
- 检查 `api/config/database.ts` 配置

**3. JWT Token 验证失败**
- 检查请求头中 Authorization 格式：`Bearer <token>`
- 确认 Token 未过期
- 重新登录获取新 Token

**4. CORS 跨域问题**
- 确认后端 CORS 中间件已正确配置
- 检查 Vite 代理配置是否正确

### 日志查看
- 前端：浏览器开发者工具 Console
- 后端：终端输出或日志文件

## 项目结构说明

```
dairy_record/
├── api/                 # 后端API
│   ├── routes/         # 路由定义
│   ├── models/         # 数据模型
│   ├── middleware/     # 中间件
│   └── config/         # 配置文件
├── src/                # 前端源码
│   ├── pages/          # 页面组件
│   ├── components/     # 公共组件
│   ├── stores/         # 状态管理
│   └── services/       # API服务
├── package.json        # 项目配置
└── vite.config.ts      # Vite配置
```

## 技术栈
- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **后端**：Express + TypeScript + JWT
- **数据库**：SQL.js（开发环境）
- **状态管理**：Zustand
- **构建工具**：Vite

## 开发指令
```bash
# 类型检查
npm run check

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```