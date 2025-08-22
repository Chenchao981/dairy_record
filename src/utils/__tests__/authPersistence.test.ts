import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AuthPersistence from '../authPersistence';

// Mock localStorage and sessionStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});

// Mock window properties
Object.defineProperty(window, 'screen', {
    value: { width: 1920, height: 1080 }
});

Object.defineProperty(window, 'navigator', {
    value: {
        language: 'zh-CN',
        platform: 'Win32'
    }
});

// Mock Intl
global.Intl = {
    DateTimeFormat: vi.fn(() => ({
        resolvedOptions: () => ({ timeZone: 'Asia/Shanghai' })
    }))
} as any;

describe('AuthPersistence', () => {
    const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
    };

    const mockAuthData = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600, // 1 hour
        user: mockUser,
        rememberMe: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset Date.now mock
        vi.spyOn(Date, 'now').mockReturnValue(1000000000000); // Fixed timestamp
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('saveAuthData', () => {
        it('应该将认证数据保存到sessionStorage（不记住登录）', () => {
            AuthPersistence.saveAuthData(mockAuthData);

            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token');
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('token_expiry', '1000003600000');
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(mockUser));
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('remember_me', 'false');
        });

        it('应该将认证数据保存到localStorage（记住登录）', () => {
            const authDataWithRemember = { ...mockAuthData, rememberMe: true };
            AuthPersistence.saveAuthData(authDataWithRemember);

            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token_expiry', '1000003600000');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(mockUser));
            expect(localStorageMock.setItem).toHaveBeenCalledWith('remember_me', 'true');
        });

        it('应该正确计算过期时间', () => {
            const mockNow = 1234567890000;
            vi.spyOn(Date, 'now').mockReturnValue(mockNow);

            AuthPersistence.saveAuthData(mockAuthData);

            const expectedExpiry = mockNow + (3600 * 1000); // 1小时后
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('token_expiry', expectedExpiry.toString());
        });
    });

    describe('getAuthData', () => {
        it('应该从sessionStorage获取认证数据', () => {
            sessionStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'auth_token': return 'mock-token';
                    case 'refresh_token': return 'mock-refresh';
                    case 'token_expiry': return '2000000000000'; // 未来时间
                    case 'user_data': return JSON.stringify(mockUser);
                    case 'remember_me': return 'false';
                    default: return null;
                }
            });

            const result = AuthPersistence.getAuthData();

            expect(result).toEqual({
                token: 'mock-token',
                refreshToken: 'mock-refresh',
                user: mockUser,
                isExpired: false,
                rememberMe: false
            });
        });

        it('应该检测过期的token', () => {
            sessionStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'auth_token': return 'mock-token';
                    case 'token_expiry': return '500000000000'; // 过去的时间
                    case 'user_data': return JSON.stringify(mockUser);
                    case 'remember_me': return 'false';
                    default: return null;
                }
            });

            const result = AuthPersistence.getAuthData();

            expect(result.isExpired).toBe(true);
        });

        it('应该处理无效的用户数据JSON', () => {
            sessionStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'auth_token': return 'mock-token';
                    case 'user_data': return 'invalid-json';
                    case 'remember_me': return 'false';
                    default: return null;
                }
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = AuthPersistence.getAuthData();

            expect(result.user).toBe(null);
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('getToken', () => {
        it('应该返回有效的token', () => {
            sessionStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'auth_token': return 'valid-token';
                    case 'token_expiry': return '2000000000000'; // 未来时间
                    case 'remember_me': return 'false';
                    default: return null;
                }
            });

            const token = AuthPersistence.getToken();
            expect(token).toBe('valid-token');
        });

        it('应该对过期token返回null', () => {
            sessionStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'auth_token': return 'expired-token';
                    case 'token_expiry': return '500000000000'; // 过去的时间
                    case 'remember_me': return 'false';
                    default: return null;
                }
            });

            const token = AuthPersistence.getToken();
            expect(token).toBe(null);
        });
    });

    describe('clearAuthData', () => {
        it('应该清除所有存储的认证数据', () => {
            AuthPersistence.clearAuthData();

            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token_expiry');
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user_data');
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('remember_me');

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token_expiry');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_data');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('remember_me');
        });
    });

    describe('isTokenNearExpiry', () => {
        it('应该检测即将过期的token（5分钟内）', () => {
            const now = 1000000000000;
            const fiveMinutesLater = now + (4 * 60 * 1000); // 4分钟后（小于5分钟）

            vi.spyOn(Date, 'now').mockReturnValue(now);
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'token_expiry') return fiveMinutesLater.toString();
                return null;
            });

            const result = AuthPersistence.isTokenNearExpiry();
            expect(result).toBe(true);
        });

        it('应该对未即将过期的token返回false', () => {
            const now = 1000000000000;
            const tenMinutesLater = now + (10 * 60 * 1000); // 10分钟后（大于5分钟）

            vi.spyOn(Date, 'now').mockReturnValue(now);
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'token_expiry') return tenMinutesLater.toString();
                return null;
            });

            const result = AuthPersistence.isTokenNearExpiry();
            expect(result).toBe(false);
        });

        it('应该对没有过期时间返回false', () => {
            sessionStorageMock.getItem.mockReturnValue(null);
            localStorageMock.getItem.mockReturnValue(null);

            const result = AuthPersistence.isTokenNearExpiry();
            expect(result).toBe(false);
        });
    });

    describe('updateToken', () => {
        it('应该更新token和过期时间（sessionStorage）', () => {
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'remember_me') return 'false';
                return null;
            });

            const mockNow = 1234567890000;
            vi.spyOn(Date, 'now').mockReturnValue(mockNow);

            AuthPersistence.updateToken('new-token', 7200);

            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('token_expiry', (mockNow + 7200000).toString());
        });

        it('应该更新token和过期时间（localStorage，记住登录）', () => {
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'remember_me') return 'true';
                return null;
            });

            const mockNow = 1234567890000;
            vi.spyOn(Date, 'now').mockReturnValue(mockNow);

            AuthPersistence.updateToken('new-token', 7200);

            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token_expiry', (mockNow + 7200000).toString());
        });
    });

    describe('getDeviceFingerprint', () => {
        it('应该生成设备指纹', () => {
            const fingerprint = AuthPersistence.getDeviceFingerprint();

            expect(typeof fingerprint).toBe('string');
            expect(fingerprint.length).toBe(16);
        });

        it('应该为相同环境生成相同指纹', () => {
            const fingerprint1 = AuthPersistence.getDeviceFingerprint();
            const fingerprint2 = AuthPersistence.getDeviceFingerprint();

            expect(fingerprint1).toBe(fingerprint2);
        });
    });

    describe('getRememberMe', () => {
        it('应该检测localStorage中的记住登录状态', () => {
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'remember_me') return 'true';
                return null;
            });
            sessionStorageMock.getItem.mockReturnValue(null);

            const result = AuthPersistence.getRememberMe();
            expect(result).toBe(true);
        });

        it('应该检测sessionStorage中的记住登录状态', () => {
            localStorageMock.getItem.mockReturnValue(null);
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'remember_me') return 'true';
                return null;
            });

            const result = AuthPersistence.getRememberMe();
            expect(result).toBe(true);
        });

        it('应该对未设置返回false', () => {
            localStorageMock.getItem.mockReturnValue(null);
            sessionStorageMock.getItem.mockReturnValue(null);

            const result = AuthPersistence.getRememberMe();
            expect(result).toBe(false);
        });
    });
});