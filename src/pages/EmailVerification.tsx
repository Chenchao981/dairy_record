import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Send, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useFormLoading } from '../hooks/useLoading';
import { LoadingSpinner } from '../components/Loading';

const EmailVerification: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { handleError } = useErrorHandler();
    const { isFormLoading, setFormLoading } = useFormLoading('email-verification');

    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'resend'>('loading');
    const [userEmail, setUserEmail] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(0);

    // 从URL获取验证参数
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // 自动验证邮箱
    useEffect(() => {
        const verifyEmail = async () => {
            if (!token || !email) {
                setVerificationStatus('error');
                return;
            }

            setUserEmail(email);

            try {
                // TODO: 实现邮箱验证API调用
                // const response = await authApi.verifyEmail(token, email);

                // 模拟API验证
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 模拟随机验证结果
                const success = Math.random() > 0.3; // 70% 成功率
                if (success) {
                    setVerificationStatus('success');
                    toast.success('邮箱验证成功！');

                    // 3秒后自动跳转到登录页面
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setVerificationStatus('expired');
                }
            } catch (error) {
                setVerificationStatus('error');
                handleError(error as Error);
            }
        };

        verifyEmail();
    }, [token, email, navigate, handleError]);

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 重新发送验证邮件
    const handleResendEmail = async () => {
        if (!email) {
            toast.error('邮箱地址无效');
            return;
        }

        try {
            setFormLoading(true);

            // TODO: 实现重新发送验证邮件API
            // const response = await authApi.resendVerificationEmail(email);

            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success('验证邮件已重新发送');
            setVerificationStatus('resend');
            setCountdown(60); // 60秒后才能再次发送
        } catch (error) {
            handleError(error as Error);
        } finally {
            setFormLoading(false);
        }
    };

    // 验证中状态
    if (verificationStatus === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-4">
                            <Mail className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">验证邮箱中...</h1>
                        <p className="text-gray-600">正在验证您的邮箱地址</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                        <div className="text-center">
                            <LoadingSpinner size="lg" text="验证中，请稍候..." />
                            {email && (
                                <p className="mt-4 text-sm text-gray-600">
                                    验证邮箱: {email}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 验证成功状态
    if (verificationStatus === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">验证成功！</h1>
                        <p className="text-gray-600">您的邮箱已成功验证</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                                    <span className="text-green-800 font-medium">邮箱验证完成</span>
                                </div>
                                <p className="text-green-700 text-sm">
                                    邮箱 {userEmail} 已成功验证
                                </p>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2">
                                <p>🎉 恭喜！您的账户已完全激活</p>
                                <p>📧 现在您可以接收重要的账户通知</p>
                                <p>🔐 您可以使用所有功能，包括密码重置</p>
                            </div>

                            <div className="text-center text-gray-500 text-sm">
                                <Clock className="w-4 h-4 inline mr-1" />
                                3秒后自动跳转到登录页面...
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
            </div>
        );
    }

    // 验证失败或过期状态
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-orange-400 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {verificationStatus === 'expired' ? '链接已过期' : '验证失败'}
                    </h1>
                    <p className="text-gray-600">
                        {verificationStatus === 'expired'
                            ? '验证链接已过期或已被使用'
                            : '邮箱验证过程中出现问题'
                        }
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                    <div className="text-center space-y-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-700 text-sm">
                                {verificationStatus === 'expired' ? (
                                    <>
                                        <p>• 验证链接可能已过期（24小时有效期）</p>
                                        <p>• 链接可能已被使用</p>
                                        <p>• 请重新发送验证邮件</p>
                                    </>
                                ) : (
                                    <>
                                        <p>• 验证令牌无效或已损坏</p>
                                        <p>• 网络连接可能存在问题</p>
                                        <p>• 请尝试重新发送验证邮件</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {verificationStatus === 'resend' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <Mail className="w-6 h-6 text-blue-600 mr-2" />
                                    <span className="text-blue-800 font-medium">邮件已发送</span>
                                </div>
                                <p className="text-blue-700 text-sm">
                                    新的验证邮件已发送到 {userEmail}
                                </p>
                                <p className="text-blue-600 text-xs mt-1">
                                    请检查您的邮箱（包括垃圾邮件文件夹）
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleResendEmail}
                                disabled={isFormLoading || countdown > 0}
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isFormLoading ? (
                                    <LoadingSpinner size="sm" text="发送中..." />
                                ) : countdown > 0 ? (
                                    <>
                                        <Clock className="w-4 h-4 mr-2" />
                                        {countdown}秒后可重新发送
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        重新发送验证邮件
                                    </>
                                )}
                            </button>

                            <div className="flex space-x-3">
                                <Link
                                    to="/register"
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
                                >
                                    重新注册
                                </Link>

                                <Link
                                    to="/login"
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    返回登录
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;