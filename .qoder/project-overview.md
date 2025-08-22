# Dairy Record - 情绪记录应用项目概览

## 项目基本信息

**项目名称**: Dairy Record  
**项目类型**: 全栈Web应用  
**主要语言**: TypeScript  
**项目版本**: 0.0.0  

## 项目简介

Dairy Record 是一个基于现代Web技术栈的情绪记录与分析应用，旨在帮助用户记录、分析和管理日常情绪变化。该应用采用前后端分离的架构，支持用户端和管理员端的双重界面。

### 核心功能
- **用户端功能**
  - 用户注册与登录（支持账号/邮箱/手机号）
  - 情绪记录（心情、强度、活动、描述等）
  - 情绪历史查看
  - 情绪数据分析与可视化

- **管理员端功能**
  - 管理员登录
  - 用户管理
  - 数据分析与统计
  - 系统设置

## 技术架构

### 前端技术栈
- **框架**: React 18.3.1 + TypeScript 5.8.3
- **构建工具**: Vite 6.3.5
- **路由管理**: React Router DOM 7.3.0
- **状态管理**: Zustand 5.0.8
- **UI组件**: 
  - Tailwind CSS 3.4.17
  - Headless UI 2.2.7
  - Heroicons 2.2.0
  - Lucide React 0.511.0
- **数据可视化**: 
  - Chart.js 4.5.0
  - React Chartjs 2 5.3.0
  - Recharts 3.1.2
- **其他工具**:
  - Clsx 2.1.1 (条件类名)
  - Tailwind Merge 3.0.2 (类名合并)
  - Sonner 2.0.7 (通知)

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express 4.21.2
- **认证**: JWT (jsonwebtoken 9.0.2)
- **密码加密**: bcryptjs 3.0.2
- **数据验证**: express-validator 7.2.1
- **跨域处理**: cors 2.8.5
- **数据库**: SQL.js 1.13.0 (SQLite内存数据库)
- **文件上传**: multer 2.0.2
- **环境变量**: dotenv 17.2.1

### 开发工具
- **代码检查**: ESLint 9.25.0 + TypeScript ESLint 8.30.1
- **类型检查**: TypeScript 5.8.3
- **样式处理**: PostCSS 8.5.3 + Autoprefixer 10.4.21
- **开发服务器**: Nodemon 3.1.10 (后端热重载)
- **并发运行**: Concurrently 9.2.0
- **代码转换**: TSX 4.20.3

## 项目结构

```
dairy_record/
├── api/                    # 后端代码
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由处理
│   ├── scripts/          # 脚本文件
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   └── app.ts            # Express应用配置
├── src/                   # 前端代码
│   ├── components/       # React组件
│   ├── hooks/            # 自定义Hook
│   ├── lib/              # 工具库
│   ├── pages/            # 页面组件
│   ├── services/         # API服务
│   ├── stores/           # 状态管理
│   └── App.tsx           # 主应用组件
├── .qoder/               # 项目文档
└── 配置文件...
```

## 开发环境配置

### 环境要求
- Node.js >= 18
- npm 或 pnpm
- 现代浏览器支持

### 安装与启动
```bash
# 安装依赖
npm install

# 启动开发环境（并发运行前后端）
npm run dev

# 单独启动前端
npm run client:dev

# 单独启动后端
npm run server:dev

# 构建生产版本
npm run build

# 类型检查
npm run check

# 代码检查
npm run lint
```

### 开发服务器
- **前端服务器**: http://localhost:5173 (Vite默认)
- **后端服务器**: http://localhost:3001 (可配置)
- **API前缀**: `/api`

## 部署配置

项目支持部署到Vercel平台：
- 配置文件: `vercel.json`
- 构建命令: `npm run build`
- 输出目录: `dist`

## 项目特点

1. **现代化技术栈**: 采用最新的React、TypeScript、Vite等技术
2. **类型安全**: 全面使用TypeScript确保代码质量
3. **组件化设计**: 模块化组件架构，便于维护和扩展
4. **响应式设计**: 使用Tailwind CSS实现移动端友好的界面
5. **权限控制**: 完整的用户认证和路由保护机制
6. **数据可视化**: 丰富的图表展示情绪数据
7. **开发体验**: 热重载、ESLint、TypeScript等提升开发效率

## 注意事项

- 当前使用SQL.js作为数据库解决方案，仅适用于开发和演示环境
- 生产环境建议替换为真实数据库（MySQL、PostgreSQL等）
- JWT密钥等敏感信息应通过环境变量配置
- 文件上传功能需要配置适当的存储解决方案