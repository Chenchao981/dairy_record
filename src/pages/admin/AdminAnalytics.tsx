import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Activity,
  Heart,
  Tag,
  Users,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import { adminApi } from '../../stores/adminStore';

interface EmotionDistribution {
  emotion: string;
  count: number;
  percentage: number;
}

interface EmotionTrend {
  date: string;
  count: number;
}

interface ActivityTag {
  tag: string;
  count: number;
}

interface UserActivity {
  id: number;
  username: string;
  emotion_count: number;
}

interface AnalyticsData {
  emotionDistribution: EmotionDistribution[];
  emotionTrends: EmotionTrend[];
  activityTags: ActivityTag[];
  activeUsers: UserActivity[];
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [emotionDistRes, activityTagsRes, userActivityRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/analytics/emotion-distribution', {
          headers: adminApi.getAuthHeaders(),
        }),
        fetch('http://localhost:3001/api/admin/analytics/activity-tags', {
          headers: adminApi.getAuthHeaders(),
        }),
        fetch('http://localhost:3001/api/admin/analytics/user-activity', {
          headers: adminApi.getAuthHeaders(),
        })
      ]);

      if (!emotionDistRes.ok || !activityTagsRes.ok || !userActivityRes.ok) {
        throw new Error('获取分析数据失败');
      }

      const [emotionData, activityData, userActivityData] = await Promise.all([
        emotionDistRes.json(),
        activityTagsRes.json(),
        userActivityRes.json()
      ]);

      setAnalyticsData({
        emotionDistribution: emotionData.data.distribution || [],
        emotionTrends: emotionData.data.trends || [],
        activityTags: activityData.data.tags || [],
        activeUsers: userActivityData.data.activeUsers || []
      });
    } catch (err: any) {
      setError(err.message || '获取分析数据失败');
      console.error('获取分析数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      '开心': '#10B981',
      '快乐': '#34D399',
      '兴奋': '#F59E0B',
      '平静': '#6366F1',
      '放松': '#8B5CF6',
      '满足': '#06B6D4',
      '悲伤': '#6B7280',
      '焦虑': '#EF4444',
      '愤怒': '#DC2626',
      '沮丧': '#7C2D12',
      '疲惫': '#374151',
      '困惑': '#9CA3AF'
    };
    return colors[emotion] || '#6B7280';
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const dataToExport = {
      exportTime: new Date().toISOString(),
      emotionDistribution: analyticsData.emotionDistribution,
      activityTags: analyticsData.activityTags,
      activeUsers: analyticsData.activeUsers
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          onClick={fetchAnalyticsData}
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
          <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
          <p className="text-gray-600 mt-1">情绪数据和用户行为分析</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>导出数据</span>
          </button>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 情绪分布图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 情绪分布饼图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-purple-600" />
              情绪分布
            </h3>
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          
          <div className="space-y-4">
            {analyticsData?.emotionDistribution?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getEmotionColor(item.emotion) }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{item.emotion}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
          
          {(!analyticsData?.emotionDistribution || analyticsData.emotionDistribution.length === 0) && (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无情绪数据</p>
            </div>
          )}
        </div>

        {/* 情绪趋势图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              情绪趋势
            </h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            {analyticsData?.emotionTrends?.map((item, index) => {
              const maxCount = Math.max(...(analyticsData.emotionTrends?.map(t => t.count) || [1]));
              const percentage = (item.count / maxCount) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-16 text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-xs text-gray-700 text-right">
                    {item.count}
                  </div>
                </div>
              );
            })}
          </div>
          
          {(!analyticsData?.emotionTrends || analyticsData.emotionTrends.length === 0) && (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无趋势数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 活动标签和活跃用户 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门活动标签 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-orange-600" />
              热门活动标签
            </h3>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            {analyticsData?.activityTags?.slice(0, 10).map((tag, index) => {
              const maxCount = Math.max(...(analyticsData.activityTags?.map(t => t.count) || [1]));
              const percentage = (tag.count / maxCount) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{tag.tag}</span>
                      <span className="text-sm text-gray-500">{tag.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {(!analyticsData?.activityTags || analyticsData.activityTags.length === 0) && (
            <div className="text-center py-8">
              <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无标签数据</p>
            </div>
          )}
        </div>

        {/* 最活跃用户 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              最活跃用户
            </h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="space-y-4">
            {analyticsData?.activeUsers?.slice(0, 8).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{index + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-500">用户ID: {user.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user.emotion_count}</div>
                  <div className="text-xs text-gray-500">条记录</div>
                </div>
              </div>
            ))}
          </div>
          
          {(!analyticsData?.activeUsers || analyticsData.activeUsers.length === 0) && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无用户数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 数据摘要 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据摘要</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analyticsData?.emotionDistribution?.reduce((sum, item) => sum + item.count, 0) || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">总情绪记录</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {analyticsData?.activityTags?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">活动标签种类</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData?.activeUsers?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">活跃用户数</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analyticsData?.emotionDistribution?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">情绪类型数</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;