import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useFormLoading } from '../hooks/useLoading';
import { LoadingSpinner } from '../components/Loading';

interface ResetPasswordRequest {
    password: string;
    confirmPassword: string;
}

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { handleFormError } = useErrorHandler();
    const { isFormLoading, setFormLoading } = useFormLoading('reset-password');

    const [formData, setFormData] = useState<ResetPasswordRequest>({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetSuccess, setIsResetSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Partial<ResetPasswordRequest>>({});
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    // 从URL获取重置token
    const resetToken = searchParams.get('token');
    const email = searchParams.get('email');

    // 验证token有效性
    useEffect(() => {
        const validateToken = async () => {
            if (!resetToken || !email) {
                setTokenValid(false);
                return;
            }

            try {
                // TODO: 实现token验证API
                // const response = await authApi.validateResetToken(resetToken, email);

                // 模拟验证
                await new Promise(resolve => setTimeout(resolve, 1000));
                setTokenValid(true);
            } catch (error) {
                setTokenValid(false);
                handleFormError(error as Error);
            }
        };

        validateToken();
    }, [resetToken, email, handleFormError]);

    // 密码强度检查
    const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const levels = [
            { score: 0, text: '请输入密码', color: 'text-gray-400' },
            { score: 1, text: '密码太弱', color: 'text-red-500' },
            { score: 2, text: '密码较弱', color: 'text-orange-500' },
            { score: 3, text: '密码中等', color: 'text-yellow-500' },
            { score: 4, text: '密码较强', color: 'text-blue-500' },
            { score: 5, text: '密码很强', color: 'text-green-500' },
        ];

        return levels[Math.min(score, 5)];
    };

    // 表单验证
    const validateForm = (): boolean => {
        const errors: Partial<ResetPasswordRequest> = {};

        if (!formData.password) {
            errors.password = '请输入新密码';
        } else if (formData.password.length < 6) {
            errors.password = '密码至少需要6个字符';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = '请确认新密码';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = '两次输入的密码不一致';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // 清除对应字段的验证错误
        if (validationErrors[name as keyof ResetPasswordRequest]) {
            setValidationErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setFormLoading(true);

            // TODO: 实现密码重置API调用
            // const response = await authApi.resetPassword({
            //   token: resetToken!,
            //   email: email!,
            //   password: formData.password
            // });

            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 2000));

            setIsResetSuccess(true);
            toast.success('密码重置成功');
        } catch (error) {
            handleFormError(error as Error);
        } finally {
            setFormLoading(false);
        }
    };

    // Token验证中
    if (tokenValid === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <LoadingSpinner size="lg" text="验证重置链接..." />
                </div>
            </div>
        );
    }

    // Token无效
    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-orange-400 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">链接已失效</h1>
                        <p className="text-gray-600">密码重置链接已过期或无效</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-700">
                                密码重置链接可能已过期（24小时有效期）或已被使用。
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                to="/forgot-password"
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                            >
                                重新申请密码重置
                            </Link>

                            <Link
                                to="/login"
                                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                返回登录
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 重置成功
    if (isResetSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">密码重置成功</h1>
                        <p className="text-gray-600">您的密码已成功重置</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-700">
                                您现在可以使用新密码登录您的账户了。
                            </p>
                        </div>

                        <Link
                            to="/login"
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                            立即登录
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* 头部 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">重置密码</h1>
                    <p className="text-gray-600">请为您的账户设置新密码</p>
                    {email && (
                        <p className="text-sm text-gray-500 mt-2">邮箱: {email}</p>
                    )}
                </div>

                {/* 重置表单 */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 新密码输入 */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                新密码
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${validationErrors.password
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 bg-white/50'
                                        }`}
                                    placeholder="请输入新密码"
                                    disabled={isFormLoading}
                                    aria-label="新密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-1 flex items-center">
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.score <= 1 ? 'bg-red-500 w-1/5' :
                                                    passwordStrength.score === 2 ? 'bg-orange-500 w-2/5' :
                                                        passwordStrength.score === 3 ? 'bg-yellow-500 w-3/5' :
                                                            passwordStrength.score === 4 ? 'bg-blue-500 w-4/5' :
                                                                'bg-green-500 w-full'
                                                }`}
                                        />
                                    </div>
                                    <span className={`text-xs ${passwordStrength.color}`}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                            )}
                            {validationErrors.password && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{validationErrors.password}</p>
                            )}
                        </div>

                        {/* 确认密码输入 */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                确认新密码
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${validationErrors.confirmPassword
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 bg-white/50'
                                        }`}
                                    placeholder="请再次输入新密码"
                                    disabled={isFormLoading}
                                    aria-label="确认新密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {validationErrors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{validationErrors.confirmPassword}</p>
                            )}
                        </div>

                        {/* 密码要求提示 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">密码要求：</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• 至少6个字符</li>
                                <li>• 建议包含大小写字母、数字和特殊字符</li>
                                <li>• 避免使用常见的密码组合</li>
                            </ul>
                        </div>

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={isFormLoading}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isFormLoading ? (
                                <LoadingSpinner size="sm" text="重置中..." />
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    重置密码
                                </>
                            )}
                        </button>

                        {/* 返回登录 */}
                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                返回登录页面
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;