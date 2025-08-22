# 开发规范与最佳实践

## 代码风格规范

### TypeScript/JavaScript规范

#### 1. 变量和函数命名
```typescript
// ✅ 使用 camelCase 命名变量和函数
const userName = 'john_doe';
const emotionRecord = { mood: 'happy', intensity: 8 };

function getUserEmotions(userId: number) {
  return apiService.getEmotions(userId);
}

// ✅ 使用 PascalCase 命名类和组件
class UserService {
  static async createUser(userData: CreateUserData) {}
}

function EmotionCard({ emotion }: EmotionCardProps) {}

// ✅ 使用 UPPER_SNAKE_CASE 命名常量
const API_BASE_URL = 'http://localhost:3001/api';
const MAX_EMOTION_INTENSITY = 10;
const DEFAULT_PAGE_SIZE = 20;

// ✅ 使用有意义的名称
// ❌ 不好的命名
const d = new Date();
const u = users.filter(x => x.active);

// ✅ 好的命名
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
```

#### 2. 接口和类型定义
```typescript
// ✅ 接口使用 PascalCase，以 I 前缀可选
interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

// ✅ 类型别名使用 PascalCase
type EmotionMood = 'happy' | 'sad' | 'angry' | 'anxious' | 'calm';
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

// ✅ 泛型参数使用单个大写字母
interface ApiService<T = any> {
  get<K>(endpoint: string): Promise<ApiResponse<K>>;
  post<K, V>(endpoint: string, data: V): Promise<ApiResponse<K>>;
}

// ✅ 枚举使用 PascalCase
enum UserRole {
  User = 'user',
  Admin = 'admin',
  SuperAdmin = 'super_admin'
}
```

#### 3. 文件和文件夹命名
```
// ✅ 组件文件使用 PascalCase
EmotionCard.tsx
UserProfile.tsx
AdminDashboard.tsx

// ✅ 普通文件使用 kebab-case 或 camelCase
api-service.ts 或 apiService.ts
auth-store.ts 或 authStore.ts
emotion-utils.ts 或 emotionUtils.ts

// ✅ 文件夹使用 kebab-case
components/
pages/
admin-panel/
emotion-management/
```

### React组件规范

#### 1. 组件结构
```typescript
// ✅ 推荐的组件结构
import { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { User } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import './EmotionCard.css'; // 如果有自定义样式

// 接口定义在组件前
interface EmotionCardProps {
  emotion: EmotionRecord;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
  showActions?: boolean;
}

// 默认props（如果使用）
const defaultProps: Partial<EmotionCardProps> = {
  showActions: true,
  className: ''
};

// 主要组件
export function EmotionCard({ 
  emotion, 
  onEdit, 
  onDelete, 
  className,
  showActions = true 
}: EmotionCardProps) {
  // 1. Hooks（按顺序：状态、副作用、自定义hook）
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  
  // 2. 计算值
  const activities = useMemo(() => 
    JSON.parse(emotion.activities || '[]'), 
    [emotion.activities]
  );
  
  // 3. 事件处理函数
  const handleEdit = () => {
    onEdit?.(emotion.id);
  };
  
  const handleDelete = () => {
    if (confirm('确认删除这条情绪记录吗？')) {
      onDelete?.(emotion.id);
    }
  };
  
  // 4. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, []);
  
  // 5. 渲染
  return (
    <div className={clsx('emotion-card', className)}>
      {/* 组件内容 */}
    </div>
  );
}

// 默认导出（如果需要）
export default EmotionCard;
```

#### 2. Props接口定义
```typescript
// ✅ 明确的Props类型定义
interface ComponentProps {
  // 必需的props
  title: string;
  data: EmotionRecord[];
  
  // 可选的props
  className?: string;
  disabled?: boolean;
  
  // 函数props - 明确参数和返回类型
  onSubmit?: (data: FormData) => void | Promise<void>;
  onError?: (error: Error) => void;
  
  // 子组件
  children?: React.ReactNode;
  
  // 特定类型的props
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger';
}

// ✅ 使用React内置类型
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
```

#### 3. 状态管理
```typescript
// ✅ 使用Zustand的最佳实践
interface AuthStore {
  // 状态
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 动作
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  
  // 计算状态
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
  
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      set({ 
        user: response.user, 
        token: response.token, 
        isLoading: false 
      });
      localStorage.setItem('auth_token', response.token);
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null });
  },
  
  clearError: () => set({ error: null }),
  
  isAuthenticated: () => {
    const { user, token } = get();
    return !!(user && token);
  }
}));
```

## 项目结构规范

### 目录组织
```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── forms/          # 表单组件
│   │   ├── EmotionForm/
│   │   └── UserForm/
│   ├── charts/         # 图表组件
│   └── layout/         # 布局组件
├── pages/              # 页面组件
│   ├── auth/          # 认证相关页面
│   ├── admin/         # 管理员页面
│   └── user/          # 用户页面
├── hooks/              # 自定义Hook
├── stores/             # 状态管理
├── services/           # API服务
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
├── constants/          # 常量定义
└── assets/            # 静态资源
```

### 导入顺序规范
```typescript
// 1. React相关导入
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

// 2. 第三方库导入
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { Chart as ChartJS } from 'chart.js';

// 3. 内部导入（按层级顺序）
import { User, EmotionRecord } from '@/types';
import { Button, Input } from '@/components/ui';
import { useAuth, usePermission } from '@/hooks';
import { authService } from '@/services';
import { formatDate, validateEmail } from '@/utils';

// 4. 相对导入
import './EmotionCard.scss';
```

## API和数据处理规范

### API服务层
```typescript
// ✅ API服务结构
class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  // 具体API方法
  async getEmotions(params: EmotionQueryParams = {}): Promise<EmotionRecord[]> {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value != null)
    ).toString();
    
    const response = await this.request<{
      emotions: EmotionRecord[];
      pagination: PaginationInfo;
    }>(`/emotions?${query}`);
    
    return response.data.emotions;
  }
}

// ✅ 导出单例实例
export const apiService = new ApiService(
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
);
```

### 错误处理规范
```typescript
// ✅ 统一错误处理
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ✅ 错误处理Hook
export function useErrorHandler() {
  const handleError = useCallback((error: Error | ApiError) => {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          toast.error('登录已过期，请重新登录');
          // 跳转到登录页
          break;
        case 403:
          toast.error('没有权限执行此操作');
          break;
        case 404:
          toast.error('请求的资源不存在');
          break;
        case 500:
          toast.error('服务器内部错误，请稍后重试');
          break;
        default:
          toast.error(error.message || '发生未知错误');
      }
    } else {
      toast.error('网络错误，请检查网络连接');
    }
    
    // 记录错误日志
    console.error('Error occurred:', error);
  }, []);
  
  return { handleError };
}
```

## 测试规范

### 单元测试
```typescript
// ✅ 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EmotionCard } from './EmotionCard';

const mockEmotion: EmotionRecord = {
  id: 1,
  mood: 'happy',
  intensity: 8,
  description: 'Test emotion',
  activities: '["运动", "听音乐"]',
  tags: '["放松"]',
  created_at: '2025-08-22T12:00:00Z'
};

describe('EmotionCard', () => {
  it('renders emotion data correctly', () => {
    render(<EmotionCard emotion={mockEmotion} />);
    
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('强度 8')).toBeInTheDocument();
    expect(screen.getByText('Test emotion')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<EmotionCard emotion={mockEmotion} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('编辑'));
    expect(onEdit).toHaveBeenCalledWith(1);
  });
});

// ✅ Hook测试示例
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.handleLogin({
        loginType: 'email',
        loginValue: 'test@example.com',
        password: 'password123'
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### API测试
```typescript
// ✅ API服务测试
describe('ApiService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });
  
  it('should fetch emotions successfully', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: { emotions: [mockEmotion] }
    }));
    
    const emotions = await apiService.getEmotions();
    expect(emotions).toHaveLength(1);
    expect(emotions[0]).toEqual(mockEmotion);
  });
  
  it('should handle API errors', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));
    
    await expect(apiService.getEmotions()).rejects.toThrow('Network error');
  });
});
```

## 性能优化规范

### React性能优化
```typescript
// ✅ 使用React.memo优化组件
export const EmotionCard = React.memo<EmotionCardProps>(({ emotion, onEdit, onDelete }) => {
  // 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.emotion.id === nextProps.emotion.id &&
         prevProps.emotion.updated_at === nextProps.emotion.updated_at;
});

// ✅ 使用useMemo缓存计算结果
const expensiveValue = useMemo(() => {
  return computeComplexStatistics(emotions);
}, [emotions]);

// ✅ 使用useCallback缓存函数
const handleSubmit = useCallback((data: FormData) => {
  onSubmit(data);
}, [onSubmit]);

// ✅ 懒加载组件
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));

function AdminRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
```

### 列表渲染优化
```typescript
// ✅ 使用key优化列表渲染
{emotions.map(emotion => (
  <EmotionCard 
    key={`emotion-${emotion.id}-${emotion.updated_at}`}
    emotion={emotion}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
))}

// ✅ 虚拟化长列表
import { FixedSizeList as List } from 'react-window';

function EmotionList({ emotions }: { emotions: EmotionRecord[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <EmotionCard emotion={emotions[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={emotions.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
}
```

## 安全规范

### 数据验证
```typescript
// ✅ 输入验证
import { z } from 'zod';

const EmotionSchema = z.object({
  mood: z.string().min(1).max(50),
  intensity: z.number().int().min(1).max(10),
  description: z.string().max(1000).optional(),
  activities: z.array(z.string().max(50)).max(10),
  tags: z.array(z.string().max(20)).max(10)
});

function validateEmotionData(data: unknown): EmotionRecord {
  return EmotionSchema.parse(data);
}
```

### XSS防护
```typescript
// ✅ 安全渲染用户输入
import DOMPurify from 'dompurify';

function SafeHTML({ content }: { content: string }) {
  const cleanContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
}

// ✅ 或者简单文本展示
function SafeText({ text }: { text: string }) {
  return <span>{text}</span>; // React自动转义
}
```

## Git提交规范

### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例
```
feat(auth): add email login support

- Add email validation in login form
- Update API service to handle email login
- Add tests for email login functionality

Closes #123
```

## 代码审查清单

### 功能性
- [ ] 代码实现了预期功能
- [ ] 处理了边界情况和错误情况
- [ ] 有适当的输入验证
- [ ] 性能考虑合理

### 代码质量
- [ ] 遵循项目代码规范
- [ ] 变量和函数命名清晰
- [ ] 代码结构合理，职责单一
- [ ] 有必要的注释和文档

### 安全性
- [ ] 没有硬编码敏感信息
- [ ] 正确处理用户输入
- [ ] 权限检查完整
- [ ] 没有安全漏洞

### 测试
- [ ] 有对应的单元测试
- [ ] 测试覆盖率合理
- [ ] 测试用例充分

这些规范将帮助团队保持代码的一致性、可维护性和高质量。