# 前端组件架构

## 组件架构概览

基于React + TypeScript的模块化组件架构，采用函数式组件和Hook模式，支持状态管理、路由保护和响应式设计。

## 核心架构模式

### 1. 组件层级结构
```
App (根组件)
├── Router (路由容器)
├── RouteGuard (路由守卫)
│   ├── UserGuard (用户权限守卫)
│   └── AdminGuard (管理员权限守卫)
├── Pages (页面组件)
│   ├── User Pages (用户端页面)
│   └── Admin Pages (管理员端页面)
├── Components (通用组件)
├── Hooks (自定义Hook)
└── Services (API服务层)
```

### 2. 设计原则
- **单一职责**: 每个组件专注于单一功能
- **组合优于继承**: 通过组合构建复杂功能
- **状态提升**: 合理管理组件状态层级
- **类型安全**: 全面的TypeScript类型定义
- **可复用性**: 抽象通用组件和逻辑

## 路由架构

### 路由配置 (`src/App.tsx`)
```typescript
export default function App() {
  return (
    <Router>
      <Routes>
        {/* 公共路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 用户保护路由 */}
        <Route path="/record" element={
          <UserGuard>
            <EmotionRecord />
          </UserGuard>
        } />
        
        {/* 管理员保护路由 */}
        <Route path="/admin" element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}
```

### 路由守卫组件

#### UserGuard (`src/components/RouteGuard.tsx`)
```typescript
interface UserGuardProps {
  children: React.ReactNode;
}

export function UserGuard({ children }: UserGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'user') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
```

#### AdminGuard
```typescript
export function AdminGuard({ children }: UserGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}
```

## 页面组件

### 用户端页面

#### 1. 首页 (`src/pages/Home.tsx`)
**功能**: 应用介绍、导航入口
**特点**: 
- 响应式布局
- 功能介绍展示
- 快速导航链接

#### 2. 用户认证页面
- **登录页** (`src/pages/Login.tsx`)
  - 多种登录方式（账号/邮箱/手机）
  - 表单验证
  - 状态管理集成
  
- **注册页** (`src/pages/Register.tsx`)
  - 用户信息收集
  - 实时验证反馈
  - 密码强度检测

#### 3. 情绪管理页面
- **情绪记录** (`src/pages/EmotionRecord.tsx`)
  ```typescript
  interface EmotionRecordProps {}
  
  export default function EmotionRecord() {
    const [formData, setFormData] = useState<EmotionFormData>({
      mood: '',
      intensity: 5,
      activities: [],
      description: '',
      tags: []
    });
    
    const handleSubmit = async (data: EmotionFormData) => {
      // API调用逻辑
      await apiService.createEmotion(data);
    };
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <EmotionForm 
          data={formData}
          onSubmit={handleSubmit}
          onChange={setFormData}
        />
      </div>
    );
  }
  ```

- **情绪历史** (`src/pages/EmotionHistory.tsx`)
  - 时间轴展示
  - 筛选和搜索
  - 分页加载
  
- **情绪分析** (`src/pages/EmotionAnalysis.tsx`)
  - 图表可视化
  - 统计分析
  - 趋势展示

### 管理员端页面

#### 管理员布局 (`src/components/admin/AdminLayout.tsx`)
```typescript
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

#### 管理员页面
- **仪表板** (`src/pages/admin/AdminDashboard.tsx`)
- **用户管理** (`src/pages/admin/AdminUsers.tsx`)
- **数据分析** (`src/pages/admin/AdminAnalytics.tsx`)
- **系统设置** (`src/pages/admin/AdminSettings.tsx`)

## 通用组件

### 1. 表单组件
```typescript
// 情绪强度选择器
interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function IntensitySlider({ value, onChange, min = 1, max = 10 }: IntensitySliderProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        情绪强度: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg slider"
      />
    </div>
  );
}

// 多选标签组件
interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onTagChange: (tags: string[]) => void;
  maxTags?: number;
}

export function TagSelector({ selectedTags, availableTags, onTagChange, maxTags = 10 }: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < maxTags) {
      onTagChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        选择标签 ({selectedTags.length}/{maxTags})
      </label>
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-sm border ${
              selectedTags.includes(tag)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2. 数据展示组件
```typescript
// 情绪卡片组件
interface EmotionCardProps {
  emotion: EmotionRecord;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function EmotionCard({ emotion, onEdit, onDelete, showActions = true }: EmotionCardProps) {
  const activities = JSON.parse(emotion.activities || '[]');
  const tags = JSON.parse(emotion.tags || '[]');
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{emotion.mood}</h3>
        <IntensityBadge intensity={emotion.intensity} />
      </div>
      
      <p className="text-gray-600 mb-3">{emotion.description}</p>
      
      {activities.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-500">活动:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {activities.map((activity: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {tags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{formatDate(emotion.created_at)}</span>
        {showActions && (
          <div className="space-x-2">
            {onEdit && (
              <button onClick={() => onEdit(emotion.id)} className="text-blue-600 hover:underline">
                编辑
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(emotion.id)} className="text-red-600 hover:underline">
                删除
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 强度徽章组件
function IntensityBadge({ intensity }: { intensity: number }) {
  const getColorClass = (intensity: number) => {
    if (intensity <= 3) return 'bg-green-100 text-green-800';
    if (intensity <= 6) return 'bg-yellow-100 text-yellow-800';
    if (intensity <= 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClass(intensity)}`}>
      强度 {intensity}
    </span>
  );
}
```

### 3. 图表组件
```typescript
// 情绪趋势图
interface EmotionTrendChartProps {
  data: EmotionRecord[];
  period: 'week' | 'month' | 'year';
}

export function EmotionTrendChart({ data, period }: EmotionTrendChartProps) {
  const chartData = useMemo(() => {
    // 处理数据逻辑
    return processChartData(data, period);
  }, [data, period]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">情绪趋势</h3>
      <Line 
        data={chartData}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 10
            }
          }
        }}
      />
    </div>
  );
}

// 情绪分布饼图
export function MoodDistributionChart({ data }: { data: EmotionRecord[] }) {
  const distributionData = useMemo(() => {
    const moodCounts = data.reduce((acc, emotion) => {
      acc[emotion.mood] = (acc[emotion.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(moodCounts),
      datasets: [{
        data: Object.values(moodCounts),
        backgroundColor: [
          '#FF6384',
          '#36A2EB', 
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }]
    };
  }, [data]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">情绪分布</h3>
      <Pie data={distributionData} />
    </div>
  );
}
```

## 自定义Hook

### 认证Hook (`src/hooks/useAuth.tsx`)
```typescript
export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (loginData: LoginData) => {
    try {
      const response = await apiService.login(loginData);
      login(response.user, response.token);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return {
    user,
    token,
    isAuthenticated,
    handleLogin,
    handleLogout
  };
}
```

### 权限Hook (`src/hooks/usePermission.tsx`)
```typescript
export function usePermission() {
  const { user } = useAuthStore();

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole('admin');
  const isUser = () => hasRole('user');

  const canAccess = (requiredRole: string) => {
    if (!user) return false;
    return hasRole(requiredRole);
  };

  return {
    hasRole,
    isAdmin,
    isUser,
    canAccess,
    currentRole: user?.role
  };
}
```

### 主题Hook (`src/hooks/useTheme.ts`)
```typescript
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return { theme, toggleTheme };
}
```

## 状态管理

### 认证状态 (`src/stores/authStore.ts`)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
```

### 管理员状态 (`src/stores/adminStore.ts`)
```typescript
interface AdminState {
  users: User[];
  stats: SystemStats | null;
  loading: boolean;
  fetchUsers: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  stats: null,
  loading: false,
  
  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await apiService.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  fetchStats: async () => {
    try {
      const stats = await apiService.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }
}));
```

## 样式系统

### Tailwind CSS配置
- 响应式断点
- 自定义颜色主题
- 组件样式类
- 暗色主题支持

### 组件样式模式
```typescript
// 样式工具函数
export const buttonStyles = {
  base: "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  variants: {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  },
  sizes: {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  }
};

// 使用示例
<button className={clsx(buttonStyles.base, buttonStyles.variants.primary, buttonStyles.sizes.md)}>
  提交
</button>
```

## 组件测试策略

### 单元测试
- 使用Jest + React Testing Library
- 组件渲染测试
- 用户交互测试
- Hook测试

### 集成测试
- 页面级组件测试
- 状态管理集成测试
- API调用测试

### E2E测试
- 用户流程测试
- 跨浏览器测试
- 性能测试

这种组件架构确保了代码的可维护性、可扩展性和类型安全性，为项目的长期发展奠定了坚实的基础。