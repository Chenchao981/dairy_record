import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Heart } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { RegisterRequest } from '../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    username: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterRequest & { confirmPassword: string }>>({});

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 清除错误信息
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // 表单验证
  const validateForm = (): boolean => {
    const errors: Partial<RegisterRequest & { confirmPassword: string }> = {};

    if (!formData.username) {
      errors.username = '请输入用户名';
    } else if (formData.username.length < 2) {
      errors.username = '用户名至少需要2个字符';
    } else if (formData.username.length > 20) {
      errors.username = '用户名不能超过20个字符';
    }

    if (!formData.email) {
      errors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      errors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符';
    } else if (formData.password.length > 50) {
      errors.password = '密码不能超过50个字符';
    }

    if (!confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (confirmPassword !== formData.password) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 清除对应字段的验证错误
    if (validationErrors[name as keyof (RegisterRequest & { confirmPassword: string })]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await register(formData);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">加入我们</h1>
          <p className="text-gray-600">创建您的情绪疗愈账户</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 全局错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    validationErrors.username
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white/50'
                  }`}
                  placeholder="请输入您的用户名"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.username && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
              )}
            </div>

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
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    validationErrors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white/50'
                  }`}
                  placeholder="请输入您的邮箱地址"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
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
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    validationErrors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white/50'
                  }`}
                  placeholder="请输入您的密码"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* 确认密码输入 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    validationErrors.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white/50'
                  }`}
                  placeholder="请再次输入您的密码"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  注册中...
                </div>
              ) : (
                '创建账户'
              )}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              已有账户？{' '}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            开始您的情绪疗愈之旅 🌸
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;