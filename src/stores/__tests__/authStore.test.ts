import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import * as authApi from '../../services/api';

// Mock authApi
vi.mock('../../services/api', () => ({
    authApi: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        validateToken: vi.fn(),
    },
    clearAuth: vi.fn(),
}));

// Mock AuthPersistence
vi.mock('../../utils/authPersistence', () => ({
    default: {
        saveAuthData: vi.fn(),
        getAuthData: vi.fn(),
        clearAuthData: vi.fn(),
        getToken: vi.fn(),
        validateSession: vi.fn(),
        startAutoRefresh: vi.fn(),
        isTokenNearExpiry: vi.fn(),
        saveDeviceFingerprint: vi.fn(),
    }
}));

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

describe('useAuthStore', () => {
    const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user' as const,
        created_at: '2023-01-01T00:00:00.000Z',
        is_active: true,
    };

    const mockLoginResponse = {
        success: true,
        data: {
            user: mockUser,
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
        }
    };

    beforeEach(() => {
        // 重置store状态
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            rememberMe: false,
            tokenExpiry: null,
        });

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('login', () => {
        it('应该成功登录用户', async () => {
            vi.mocked(authApi.authApi.login).mockResolvedValue(mockLoginResponse);

            const store = useAuthStore.getState();
            const result = await store.login({
                loginType: 'email',
                loginValue: 'test@example.com',
                password: 'password123',
            });

            expect(result).toBe(true);
            expect(useAuthStore.getState().user).toEqual(mockUser);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);
            expect(useAuthStore.getState().isLoading).toBe(false);
            expect(useAuthStore.getState().error).toBe(null);
        });

        it('应该处理登录失败', async () => {
            const errorResponse = {
                success: false,
                error: '用户名或密码错误',
            };

            vi.mocked(authApi.authApi.login).mockResolvedValue(errorResponse);

            const store = useAuthStore.getState();
            const result = await store.login({
                loginType: 'email',
                loginValue: 'test@example.com',
                password: 'wrongpassword',
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().user).toBe(null);
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(useAuthStore.getState().error).toBe('用户名或密码错误');
        });

        it('应该处理网络错误', async () => {
            vi.mocked(authApi.authApi.login).mockRejectedValue(new Error('网络错误'));

            const store = useAuthStore.getState();
            const result = await store.login({
                loginType: 'email',
                loginValue: 'test@example.com',
                password: 'password123',
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('网络错误');
        });

        it('应该设置记住登录状态', async () => {
            vi.mocked(authApi.authApi.login).mockResolvedValue(mockLoginResponse);

            const store = useAuthStore.getState();
            await store.login({
                loginType: 'email',
                loginValue: 'test@example.com',
                password: 'password123',
            }, true);

            expect(useAuthStore.getState().rememberMe).toBe(true);
        });
    });

    describe('register', () => {
        it('应该成功注册用户', async () => {
            const registerResponse = {
                success: true,
                data: { message: '注册成功' }
            };

            vi.mocked(authApi.authApi.register).mockResolvedValue(registerResponse);

            const store = useAuthStore.getState();
            const result = await store.register({
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'password123',
            });

            expect(result).toBe(true);
            expect(useAuthStore.getState().error).toBe(null);
        });

        it('应该处理注册失败', async () => {
            const errorResponse = {
                success: false,
                error: '邮箱已被使用',
            };

            vi.mocked(authApi.authApi.register).mockResolvedValue(errorResponse);

            const store = useAuthStore.getState();
            const result = await store.register({
                username: 'newuser',
                email: 'existing@example.com',
                password: 'password123',
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('邮箱已被使用');
        });
    });

    describe('logout', () => {
        beforeEach(() => {
            // 设置已登录状态
            useAuthStore.setState({
                user: mockUser,
                isAuthenticated: true,
                rememberMe: true,
            });
        });

        it('应该成功注销用户', async () => {
            vi.mocked(authApi.authApi.logout).mockResolvedValue({ success: true });

            const store = useAuthStore.getState();
            await store.logout();

            expect(useAuthStore.getState().user).toBe(null);
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(useAuthStore.getState().rememberMe).toBe(false);
            expect(useAuthStore.getState().tokenExpiry).toBe(null);
        });

        it('应该处理注销API失败但仍清除本地状态', async () => {
            vi.mocked(authApi.authApi.logout).mockRejectedValue(new Error('网络错误'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const store = useAuthStore.getState();
            await store.logout();

            expect(useAuthStore.getState().user).toBe(null);
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('注销请求失败:', expect.any(Error));
        });
    });

    describe('getCurrentUser', () => {
        it('应该获取当前用户信息', async () => {
            const userResponse = {
                success: true,
                data: { user: mockUser }
            };

            vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(userResponse);

            const store = useAuthStore.getState();
            await store.getCurrentUser();

            expect(useAuthStore.getState().user).toEqual(mockUser);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);
        });

        it('应该处理获取用户信息失败', async () => {
            const errorResponse = {
                success: false,
                error: '用户不存在'
            };

            vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(errorResponse);

            const store = useAuthStore.getState();
            await store.getCurrentUser();

            expect(useAuthStore.getState().user).toBe(null);
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
        });
    });

    describe('clearError', () => {
        it('应该清除错误状态', () => {
            useAuthStore.setState({ error: '测试错误' });

            const store = useAuthStore.getState();
            store.clearError();

            expect(useAuthStore.getState().error).toBe(null);
        });
    });

    describe('checkAuth', () => {
        it('应该验证有效的认证状态', async () => {
            vi.mocked(authApi.authApi.validateToken).mockResolvedValue(true);
            vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue({
                success: true,
                data: { user: mockUser }
            });

            const store = useAuthStore.getState();
            const result = await store.checkAuth();

            expect(result).toBe(true);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);
        });

        it('应该处理无效的认证状态', async () => {
            vi.mocked(authApi.authApi.validateToken).mockResolvedValue(false);

            const store = useAuthStore.getState();
            const result = await store.checkAuth();

            expect(result).toBe(false);
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
        });
    });

    describe('refreshToken', () => {
        it('应该成功刷新token', async () => {
            // Mock AuthPersistence.getAuthData
            const AuthPersistence = await import('../../utils/authPersistence');
            vi.mocked(AuthPersistence.default.getAuthData).mockReturnValue({
                token: 'old-token',
                refreshToken: 'refresh-token',
                user: mockUser,
                isExpired: false,
                rememberMe: false,
            });

            const store = useAuthStore.getState();
            const result = await store.refreshToken();

            expect(result).toBe(true);
        });

        it('应该处理没有refresh token的情况', async () => {
            // Mock AuthPersistence.getAuthData
            const AuthPersistence = await import('../../utils/authPersistence');
            vi.mocked(AuthPersistence.default.getAuthData).mockReturnValue({
                token: 'old-token',
                refreshToken: null,
                user: mockUser,
                isExpired: false,
                rememberMe: false,
            });

            const store = useAuthStore.getState();
            const result = await store.refreshToken();

            expect(result).toBe(false);
        });
    });
});