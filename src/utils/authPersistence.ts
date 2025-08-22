// 登录状态持久化工具类
export class AuthPersistence {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
    private static readonly USER_KEY = 'user_data';
    private static readonly REMEMBER_ME_KEY = 'remember_me';

    // Token刷新间隔（分钟）
    private static readonly REFRESH_INTERVAL = 15;
    private static refreshTimer: NodeJS.Timeout | null = null;

    /**
     * 保存认证信息
     */
    static saveAuthData(data: {
        token: string;
        refreshToken?: string;
        expiresIn: number; // 过期时间（秒）
        user: any;
        rememberMe?: boolean;
    }): void {
        const { token, refreshToken, expiresIn, user, rememberMe = false } = data;

        // 计算过期时间
        const expiryTime = Date.now() + (expiresIn * 1000);

        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem(this.TOKEN_KEY, token);
        storage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        storage.setItem(this.USER_KEY, JSON.stringify(user));
        storage.setItem(this.REMEMBER_ME_KEY, rememberMe.toString());

        if (refreshToken) {
            storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }

        // 如果选择记住登录，也在 localStorage 中保存一份
        if (rememberMe) {
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
            if (refreshToken) {
                localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
            }
        }

        // 启动自动刷新
        this.startAutoRefresh();
    }

    /**
     * 获取认证信息
     */
    static getAuthData(): {
        token: string | null;
        refreshToken: string | null;
        user: any | null;
        isExpired: boolean;
        rememberMe: boolean;
    } {
        const rememberMe = this.getRememberMe();
        const storage = rememberMe ? localStorage : sessionStorage;

        const token = storage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
        const refreshToken = storage.getItem(this.REFRESH_TOKEN_KEY) || localStorage.getItem(this.REFRESH_TOKEN_KEY);
        const expiryTime = storage.getItem(this.TOKEN_EXPIRY_KEY) || localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        const userData = storage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);

        let user = null;
        try {
            user = userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('解析用户数据失败:', error);
        }

        const isExpired = expiryTime ? Date.now() > parseInt(expiryTime) : false;

        return {
            token,
            refreshToken,
            user,
            isExpired,
            rememberMe
        };
    }

    /**
     * 获取当前有效的 Token
     */
    static getToken(): string | null {
        const { token, isExpired } = this.getAuthData();
        return isExpired ? null : token;
    }

    /**
     * 检查是否记住登录
     */
    static getRememberMe(): boolean {
        return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true' ||
            sessionStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    }

    /**
     * 清除认证信息
     */
    static clearAuthData(): void {
        // 清除 sessionStorage
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.REMEMBER_ME_KEY);

        // 清除 localStorage
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.REMEMBER_ME_KEY);

        // 停止自动刷新
        this.stopAutoRefresh();
    }

    /**
     * 检查 Token 是否即将过期（5分钟内过期）
     */
    static isTokenNearExpiry(): boolean {
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY) ||
            sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);

        if (!expiryTime) return false;

        const expiry = parseInt(expiryTime);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5分钟

        return expiry - now < fiveMinutes;
    }

    /**
     * 更新 Token
     */
    static updateToken(newToken: string, expiresIn: number): void {
        const rememberMe = this.getRememberMe();
        const storage = rememberMe ? localStorage : sessionStorage;
        const expiryTime = Date.now() + (expiresIn * 1000);

        storage.setItem(this.TOKEN_KEY, newToken);
        storage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

        // 如果记住登录，同时更新 localStorage
        if (rememberMe) {
            localStorage.setItem(this.TOKEN_KEY, newToken);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
    }

    /**
     * 启动自动刷新 Token
     */
    static startAutoRefresh(): void {
        this.stopAutoRefresh(); // 先停止现有的定时器

        this.refreshTimer = setInterval(() => {
            const authData = this.getAuthData();

            if (authData.token && this.isTokenNearExpiry()) {
                // 触发 Token 刷新事件
                window.dispatchEvent(new CustomEvent('auth:token-refresh-needed', {
                    detail: authData
                }));
            }
        }, this.REFRESH_INTERVAL * 60 * 1000); // 每15分钟检查一次
    }

    /**
     * 停止自动刷新
     */
    static stopAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * 获取设备指纹（简单版本）
     */
    static getDeviceFingerprint(): string {
        const screen = `${window.screen.width}x${window.screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;

        return btoa(`${screen}-${timezone}-${language}-${platform}`).substring(0, 16);
    }

    /**
     * 验证会话完整性
     */
    static validateSession(): boolean {
        const authData = this.getAuthData();

        if (!authData.token || !authData.user) {
            return false;
        }

        // 检查是否在不同设备上登录（简单检查）
        const currentFingerprint = this.getDeviceFingerprint();
        const savedFingerprint = localStorage.getItem('device_fingerprint') ||
            sessionStorage.getItem('device_fingerprint');

        if (savedFingerprint && savedFingerprint !== currentFingerprint) {
            console.warn('设备指纹不匹配，可能在其他设备上登录');
            // 可以选择强制重新登录或发送通知
        }

        return true;
    }

    /**
     * 保存设备指纹
     */
    static saveDeviceFingerprint(): void {
        const fingerprint = this.getDeviceFingerprint();
        const rememberMe = this.getRememberMe();
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('device_fingerprint', fingerprint);

        if (rememberMe) {
            localStorage.setItem('device_fingerprint', fingerprint);
        }
    }

    /**
     * 检查是否有有效的认证状态
     */
    static hasValidAuth(): boolean {
        const authData = this.getAuthData();
        return !!(authData.token && !authData.isExpired && authData.user);
    }

    /**
     * 获取认证状态摘要
     */
    static getAuthSummary(): {
        isAuthenticated: boolean;
        user: any | null;
        tokenExpiry: Date | null;
        rememberMe: boolean;
        needsRefresh: boolean;
    } {
        const authData = this.getAuthData();
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY) ||
            sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);

        return {
            isAuthenticated: this.hasValidAuth(),
            user: authData.user,
            tokenExpiry: expiryTime ? new Date(parseInt(expiryTime)) : null,
            rememberMe: authData.rememberMe,
            needsRefresh: this.isTokenNearExpiry()
        };
    }
}

// 自动初始化
if (typeof window !== 'undefined') {
    // 页面加载时检查认证状态
    window.addEventListener('load', () => {
        if (AuthPersistence.hasValidAuth()) {
            AuthPersistence.startAutoRefresh();
        }
    });

    // 页面隐藏时停止自动刷新（节省资源）
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            AuthPersistence.stopAutoRefresh();
        } else if (AuthPersistence.hasValidAuth()) {
            AuthPersistence.startAutoRefresh();
        }
    });

    // 监听存储变化（多标签页同步）
    window.addEventListener('storage', (event) => {
        if (event.key === AuthPersistence['TOKEN_KEY'] ||
            event.key === AuthPersistence['USER_KEY']) {
            // 触发认证状态同步事件
            window.dispatchEvent(new CustomEvent('auth:state-changed', {
                detail: AuthPersistence.getAuthSummary()
            }));
        }
    });
}

export default AuthPersistence;