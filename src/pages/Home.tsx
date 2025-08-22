import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, LogOut, Settings, BookOpen, TrendingUp, Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, checkAuth, isLoading } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 页面加载时检查认证状态
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* 头部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">情绪疗愈</h1>
            </div>

            {/* 桌面端用户信息 */}
            <div className="hidden sm:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                aria-label="打开菜单"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* 移动端菜单 */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-white/20 bg-white/95 backdrop-blur-sm">
              <div className="px-4 py-4 space-y-3">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{user.username}</div>
                        <div className="text-sm text-gray-500">已登录</div>
                      </div>
                    </div>
                    <Link
                      to="/record"
                      className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5" />
                      <span>情绪记录</span>
                    </Link>
                    <Link
                      to="/history"
                      className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>历史记录</span>
                    </Link>
                    <Link
                      to="/analysis"
                      className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span>情绪分析</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-3"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>退出登录</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block w-full px-4 py-3 text-center text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full px-4 py-3 text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      注册账户
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {isAuthenticated && user ? (
          // 已登录用户的主页内容
          <div>
            {/* 欢迎区域 */}
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 px-2">
                欢迎回来，{user.username}！
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 px-4">
                让我们继续您的情绪疗愈之旅 ✨
              </p>
            </div>

            {/* 功能卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* 情绪记录 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 sm:transform sm:hover:scale-105">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">情绪记录</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                  记录您的每日情绪状态，追踪情感变化轨迹
                </p>
                <Link
                  to="/record"
                  className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 text-center font-medium active:scale-95"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  开始记录
                </Link>
              </div>

              {/* 情绪分析 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 sm:transform sm:hover:scale-105">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">情绪分析</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                  查看您的情绪趋势图表和深度分析报告
                </p>
                <Link
                  to="/analysis"
                  className="block w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-center font-medium active:scale-95"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  查看分析
                </Link>
              </div>

              {/* 疗愈指南 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 sm:transform sm:hover:scale-105 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">疗愈指南</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                  获取个性化的情绪调节建议和疗愈方案
                </p>
                <Link
                  to="/history"
                  className="block w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 text-center font-medium active:scale-95"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  历史记录
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // 未登录用户的欢迎页面
          <div className="text-center px-4">
            {/* 主标题 */}
            <div className="mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mb-4 sm:mb-6">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
                情绪疗愈空间
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
                一个专注于情绪健康的平台，帮助您记录、分析和改善情绪状态，
                开启内心的疗愈之旅。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 active:scale-95 sm:transform sm:hover:scale-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  立即开始
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 border-purple-500 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 active:scale-95"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  已有账户
                </Link>
              </div>
            </div>

            {/* 功能介绍 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
              <div className="text-center p-4 sm:p-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">情绪记录</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  简单直观的情绪记录工具，帮助您追踪每日情感变化
                </p>
              </div>
              <div className="text-center p-4 sm:p-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">智能分析</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  基于您的记录生成情绪趋势图表和深度分析报告
                </p>
              </div>
              <div className="text-center p-4 sm:p-0 sm:col-span-2 lg:col-span-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">疗愈指南</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  个性化的情绪调节建议和专业的疗愈方案推荐
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;