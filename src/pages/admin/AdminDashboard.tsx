import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  TrendingUp, 
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { adminApi } from '../../stores/adminStore';

interface DashboardStats {
  totalUsers: number;
  totalEmotions: number;
  todayUsers: number;
  todayEmotions: number;
}

interface RecentActivity {
  type: string;
  user_name: string;
  timestamp: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [emotionStats, setEmotionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取所有数据
      const [overviewRes, userStatsRes, emotionStatsRes] = await Promise.all([
        adminApi.getAuthHeaders() ? fetch('http://localhost:3001/api/admin/dashboard/overview', {
          headers: adminApi.getAuthHeaders(),
        }) : Promise.reject(new Error('未认证')),
        adminApi.getUserStats(),
        fetch('http://localhost:3001/api/admin/stats/emotions', {
          headers: adminApi.getAuthHeaders(),
        })
      ]);

      if (!overviewRes.ok || !emotionStatsRes.ok) {
        throw new Error('获取数据失败');
      }

      const [overviewData, userStatsData, emotionStatsData] = await Promise.all([
        overviewRes.json(),
        userStatsRes,
        emotionStatsRes.json()
      ]);

      setDashboardData(overviewData.data);
      setUserStats(userStatsData.data);
      setEmotionStats(emotionStatsData.data);
    } catch (err: any) {
      setError(err.message || '获取数据失败');
      console.error('获取仪表盘数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'user_register':
        return '用户注册';
      case 'emotion_record':
        return '情绪记录';
      default:
        return '未知活动';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 text-sm">
            <strong>错误:</strong> {error}
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600 mt-1">系统概览和关键指标</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Activity className="w-4 h-4" />
          <span>刷新数据</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 总用户数 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总用户数</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {dashboardData?.stats.totalUsers || 0}
              </p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">今日 +{dashboardData?.stats.todayUsers || 0}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 情绪记录总数 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">情绪记录</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {dashboardData?.stats.totalEmotions || 0}
              </p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">今日 +{dashboardData?.stats.todayEmotions || 0}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        {/* 本周新增用户 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">本周新增</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {userStats?.weekUsers || 0}
              </p>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">用户注册</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* 本月情绪记录 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">本月记录</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {emotionStats?.monthEmotions || 0}
              </p>
              <div className="flex items-center mt-2 text-sm">
                <Activity className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-purple-600">情绪数据</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表和活动区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快速统计 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">数据概览</h3>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <PieChart className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* 简单的数据展示 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">用户增长</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{userStats?.totalUsers || 0}</div>
                <div className="text-xs text-gray-500">总用户数</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">情绪活跃度</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{emotionStats?.totalEmotions || 0}</div>
                <div className="text-xs text-gray-500">总记录数</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">今日活跃</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {(dashboardData?.stats.todayUsers || 0) + (dashboardData?.stats.todayEmotions || 0)}
                </div>
                <div className="text-xs text-gray-500">活动总数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">最近活动</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {dashboardData?.recentActivities?.length ? (
              dashboardData.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.user_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getActivityTypeLabel(activity.type)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无最近活动</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
            <Users className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">用户管理</h4>
            <p className="text-sm text-gray-500 mt-1">查看和管理用户账户</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">数据分析</h4>
            <p className="text-sm text-gray-500 mt-1">查看详细的数据分析</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
            <Activity className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">系统监控</h4>
            <p className="text-sm text-gray-500 mt-1">监控系统运行状态</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;