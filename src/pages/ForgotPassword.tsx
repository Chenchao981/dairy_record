import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useFormLoading } from '../hooks/useLoading';
import { LoadingSpinner } from '../components/Loading';

interface ForgotPasswordRequest {
    email: string;
}

const ForgotPassword: React.FC = () => {
    const { handleFormError } = useErrorHandler();
    const { isFormLoading, setFormLoading } = useFormLoading('forgot-password');

    const [formData, setFormData] = useState<ForgotPasswordRequest>({
        email: '',
    });
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Partial<ForgotPasswordRequest>>({});

    // 表单验证
    const validateForm = (): boolean => {
        const errors: Partial<ForgotPasswordRequest> = {};

        if (!formData.email) {
            errors.email = '请输入邮箱地址';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '请输入有效的邮箱地址';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // 清除对应字段的验证错误
        if (validationErrors[name as keyof ForgotPasswordRequest]) {
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

            // TODO: 实现实际的密码重置API调用
            // const response = await authApi.requestPasswordReset(formData.email);

            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 2000));

            setIsEmailSent(true);
            toast.success('密码重置邮件已发送');
        } catch (error) {
            handleFormError(error as Error);
        } finally {
            setFormLoading(false);
        }
    };

    // 重新发送邮件
    const handleResendEmail = async () => {
        try {
            setFormLoading(true);

            // TODO: 实现重新发送邮件API
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('密码重置邮件已重新发送');
        } catch (error) {
            handleFormError(error as Error);
        } finally {
            setFormLoading(false);
        }
    };

    if (isEmailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">邮件已发送</h1>
                        <p className="text-gray-600">重置密码的邮件已发送到您的邮箱</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                        <div className="text-center space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <Mail className="w-6 h-6 text-blue-600 mr-2" />
                                    <span className="text-blue-800 font-medium">检查您的邮箱</span>
                                </div>
                                <p className="text-blue-700 text-sm">
                                    我们已将密码重置链接发送到：
                                </p>
                                <p className="text-blue-800 font-medium mt-1">{formData.email}</p>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2">
                                <p>• 请检查您的邮箱（包括垃圾邮件文件夹）</p>
                                <p>• 密码重置链接将在24小时后过期</p>
                                <p>• 点击邮件中的链接来重置您的密码</p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={handleResendEmail}
                                    disabled={isFormLoading}
                                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isFormLoading ? (
                                        <LoadingSpinner size="sm" text="重新发送中..." />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            重新发送邮件
                                        </>
                                    )}
                                </button>

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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* 头部 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">忘记密码？</h1>
                    <p className="text-gray-600">请输入您的邮箱地址，我们将发送重置密码的链接</p>
                </div>

                {/* 重置表单 */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 邮箱输入 */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                邮箱地址
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${validationErrors.email
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 bg-white/50'
                                        }`}
                                    placeholder="请输入您注册时使用的邮箱地址"
                                    disabled={isFormLoading}
                                    aria-label="邮箱地址"
                                />
                            </div>
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{validationErrors.email}</p>
                            )}
                        </div>

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={isFormLoading}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isFormLoading ? (
                                <LoadingSpinner size="sm" text="发送中..." />
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    发送重置邮件
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

export default ForgotPassword;