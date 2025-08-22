import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Bell,
  Search
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: '仪表盘',
      description: '系统概览和统计'
    },
    {
      path: '/admin/users',
      icon: Users,
      label: '用户管理',
      description: '用户列表和管理'
    },
    {
      path: '/admin/analytics',
      icon: BarChart3,
      label: '数据分析',
      description: '情绪数据分析'
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: '系统设置',
      description: '应用配置管理'
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">管理后台</h1>
                <p className="text-xs text-gray-500">情绪疗愈系统</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 管理员信息 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {admin?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {admin?.username || '管理员'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {admin?.email}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                  {admin?.role === 'super_admin' ? '超级管理员' : '管理员'}
                </span>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-3 text-left rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-purple-100' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* 登出按钮 */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-left rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* 顶部栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* 面包屑导航 */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <span>管理后台</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {menuItems.find(item => isActivePath(item.path))?.label || '页面'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 搜索框 */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 通知按钮 */}
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* 管理员头像 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">
                  {admin?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {admin?.username || '管理员'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;