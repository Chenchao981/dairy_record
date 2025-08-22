import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

// 创建包含路由的测试渲染器
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <BrowserRouter>
            {children}
            <Toaster />
        </BrowserRouter>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// 导出所有testing-library的方法
export * from '@testing-library/react';
export { customRender as render };

// Mock 数据生成函数
export const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user' as const,
    created_at: '2023-01-01T00:00:00.000Z',
    is_active: true,
};

export const mockAdminUser = {
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin' as const,
    created_at: '2023-01-01T00:00:00.000Z',
    is_active: true,
};

export const mockEmotionRecord = {
    id: 1,
    user_id: 1,
    mood: 'happy' as const,
    intensity: 4,
    description: '今天心情不错',
    activities: ['exercise', 'social'],
    date: '2023-01-01',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
};

// API 响应 Mock 助手
export const mockApiResponse = <T>(data: T, success: boolean = true) => ({
    success,
    data,
    error: success ? null : 'Mock error',
});

// 延迟函数，用于测试异步操作
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 模拟用户交互助手
    export const mockUserInteractions = {
        // 模拟表单输入
        fillForm: async (getByLabelText: any, formData: Record<string, string>) => {
    const {userEvent} = await import('@testing-library/user-event');
    const user = userEvent.setup();

    for (const [field, value] of Object.entries(formData)) {
      const input = getByLabelText(new RegExp(field, 'i'));
    await user.clear(input);
    await user.type(input, value);
    }
  },

  // 模拟按钮点击
  clickButton: async (getByRole: any, name: string | RegExp) => {
    const {userEvent} = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const button = getByRole('button', {name});
    await user.click(button);
  },
};

// 测试环境变量设置
export const setupTestEnv = () => {
        // 设置测试环境变量
        process.env.NODE_ENV = 'test';

    // 清理localStorage和sessionStorage
    localStorage.clear();
    sessionStorage.clear();
};

// 清理测试环境
export const cleanupTestEnv = () => {
        localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks?.();
};