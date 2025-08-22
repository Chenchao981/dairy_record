import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Heart, User, Phone } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { LoginRequest } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginRequest>({
    loginType: 'account',
    loginValue: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginRequest>>({});
  
  // 登录方式选项
  const loginTypes = [
    { value: 'account' as const, label: '账号', icon: User, placeholder: '请输入账号' },
    { value: 'email' as const, label: '邮箱', icon: Mail, placeholder: '请输入邮箱地址' },
    { value: 'phone' as const, label: '手机号', icon: Phone, placeholder: '请输入手机号' },
  ];

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
    const errors: Partial<LoginRequest> = {};

    if (!formData.loginValue) {
      errors.loginValue = `请输入${loginTypes.find(t => t.value === formData.loginType)?.label}`;
    } else {
      // 根据登录类型进行不同的验证
      switch (formData.loginType) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.loginValue)) {
            errors.loginValue = '请输入有效的邮箱地址';
          }
          break;
        case 'phone':
          if (!/^1[3-9]\d{9}$/.test(formData.loginValue)) {
            errors.loginValue = '请输入有效的手机号';
          }
          break;
        case 'account':
          if (formData.loginValue.length < 3 || formData.loginValue.length > 20) {
            errors.loginValue = '账号长度应为3-20个字符';
          }
          break;
      }
    }

    if (!formData.password) {
      errors.password = '请输入密码';
    } else if (formData.password.length < 3) {
      errors.password = '密码至少需要3个字符';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除对应字段的验证错误
    if (validationErrors[name as keyof LoginRequest]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await login(formData);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">欢迎回来</h1>
          <p className="text-gray-600">登录您的情绪疗愈空间</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 全局错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 登录方式选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                登录方式
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                {loginTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, loginType: type.value, loginValue: '' }))}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      formData.loginType === type.value
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    disabled={isLoading}
                  >
                    <type.icon className="w-4 h-4 mr-1" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 登录凭证输入 */}
            <div>
              <label htmlFor="loginValue" className="block text-sm font-medium text-gray-700 mb-2">
                {loginTypes.find(t => t.value === formData.loginType)?.label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {React.createElement(loginTypes.find(t => t.value === formData.loginType)?.icon || User, {
                    className: "h-5 w-5 text-gray-400"
                  })}
                </div>
                <input
                  id="loginValue"
                  name="loginValue"
                  type={formData.loginType === 'email' ? 'email' : 'text'}
                  value={formData.loginValue}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    validationErrors.loginValue
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white/50'
                  }`}
                  placeholder={loginTypes.find(t => t.value === formData.loginType)?.placeholder}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.loginValue && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.loginValue}</p>
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

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  登录中...
                </div>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账户？{' '}
              <Link
                to="/register"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            让我们一起开启内心的疗愈之旅 ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;