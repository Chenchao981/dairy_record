import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';

interface EmotionRecord {
  id: number;
  mood: string;
  intensity: number;
  activities: string[];
  description: string;
  created_at: string;
}

interface TrendData {
  date: string;
  intensity: number;
  mood: string;
}

interface MoodDistribution {
  mood: string;
  count: number;
  percentage: number;
}

interface ActivityStats {
  activity: string;
  count: number;
  avgIntensity: number;
}

const EmotionAnalysis: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [moodDistribution, setMoodDistribution] = useState<MoodDistribution[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [wordCloudData, setWordCloudData] = useState<{ text: string; value: number }[]>([]);

  // 心情标签和颜色映射
  const moodLabels: { [key: string]: string } = {
    very_happy: '非常开心',
    happy: '开心',
    neutral: '平静',
    sad: '难过',
    angry: '愤怒'
  };

  const moodColors: { [key: string]: string } = {
    very_happy: '#ec4899',
    happy: '#10b981',
    neutral: '#6b7280',
    sad: '#3b82f6',
    angry: '#ef4444'
  };

  const activityLabels: { [key: string]: string } = {
    work: '工作',
    exercise: '运动',
    social: '社交',
    family: '家庭',
    study: '学习',
    music: '音乐',
    coffee: '咖啡',
    travel: '旅行',
    relax: '放松'
  };

  useEffect(() => {
    fetchEmotionRecords();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      processAnalyticsData();
    }
  }, [records, timeRange]);

  const fetchEmotionRecords = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      const response = await fetch('/api/emotions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        toast.error('获取数据失败');
      }
    } catch (error) {
      console.error('获取情绪记录失败:', error);
      toast.error('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecords = () => {
    if (timeRange === 'all') return records;
    
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return records.filter(record => new Date(record.created_at) >= cutoffDate);
  };

  const processAnalyticsData = () => {
    const filteredRecords = getFilteredRecords();
    
    // 处理趋势数据
    const trendMap = new Map<string, { total: number; count: number; moods: string[] }>();
    
    filteredRecords.forEach(record => {
      const date = record.created_at.split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { total: 0, count: 0, moods: [] });
      }
      const dayData = trendMap.get(date)!;
      dayData.total += record.intensity;
      dayData.count += 1;
      dayData.moods.push(record.mood);
    });
    
    const trendArray = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        intensity: Math.round((data.total / data.count) * 10) / 10,
        mood: data.moods[0] // 取第一个心情作为代表
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTrendData(trendArray);
    
    // 处理心情分布数据
    const moodCount = new Map<string, number>();
    filteredRecords.forEach(record => {
      moodCount.set(record.mood, (moodCount.get(record.mood) || 0) + 1);
    });
    
    const totalRecords = filteredRecords.length;
    const moodDistArray = Array.from(moodCount.entries())
      .map(([mood, count]) => ({
        mood: moodLabels[mood] || mood,
        count,
        percentage: Math.round((count / totalRecords) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    setMoodDistribution(moodDistArray);
    
    // 处理活动统计数据
    const activityMap = new Map<string, { count: number; totalIntensity: number }>();
    
    filteredRecords.forEach(record => {
      record.activities.forEach(activity => {
        if (!activityMap.has(activity)) {
          activityMap.set(activity, { count: 0, totalIntensity: 0 });
        }
        const activityData = activityMap.get(activity)!;
        activityData.count += 1;
        activityData.totalIntensity += record.intensity;
      });
    });
    
    const activityArray = Array.from(activityMap.entries())
      .map(([activity, data]) => ({
        activity: activityLabels[activity] || activity,
        count: data.count,
        avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    setActivityStats(activityArray);
    
    // 处理词云数据（基于描述文本）
    const wordCount = new Map<string, number>();
    filteredRecords.forEach(record => {
      if (record.description) {
        // 简单的中文分词（实际项目中可能需要更复杂的分词库）
        const words = record.description
          .replace(/[，。！？；：、]/g, ' ')
          .split(' ')
          .filter(word => word.length > 1);
        
        words.forEach(word => {
          wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });
      }
    });
    
    const wordCloudArray = Array.from(wordCount.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
    
    setWordCloudData(wordCloudArray);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载分析数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和时间范围选择器 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">情绪分析</h1>
              <p className="text-gray-600">深入了解你的情绪模式和趋势</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="90d">最近90天</option>
                <option value="all">全部时间</option>
              </select>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总记录数</p>
                <p className="text-2xl font-bold text-gray-900">{getFilteredRecords().length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均强度</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getFilteredRecords().length > 0 
                    ? (getFilteredRecords().reduce((sum, r) => sum + r.intensity, 0) / getFilteredRecords().length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃天数</p>
                <p className="text-2xl font-bold text-gray-900">{trendData.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">心情类型</p>
                <p className="text-2xl font-bold text-gray-900">{moodDistribution.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 情绪趋势图 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              情绪强度趋势
            </h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[1, 10]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                    formatter={(value: any) => [value, '强度']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <p>暂无趋势数据</p>
              </div>
            )}
          </div>

          {/* 心情分布饼图 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-pink-600" />
              心情分布
            </h3>
            {moodDistribution.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center">
                <ResponsiveContainer width="60%" height={250}>
                  <RechartsPieChart width={400} height={300}>
                    <Pie
                      data={moodDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ mood, percentage }) => `${mood} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(moodColors)[index % Object.values(moodColors).length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="w-full lg:w-40% space-y-2">
                  {moodDistribution.map((item, index) => {
                    const moodKey = Object.keys(moodLabels).find(key => moodLabels[key] === item.mood);
                    const color = moodColors[moodKey || ''] || '#6b7280';
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-sm text-gray-700">{item.mood}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-250 flex items-center justify-center text-gray-500">
                <p>暂无心情数据</p>
              </div>
            )}
          </div>
        </div>

        {/* 活动统计和词云 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 活动统计 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              活动统计
            </h3>
            {activityStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="activity" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'count') return [value, '次数'];
                      if (name === 'avgIntensity') return [value, '平均强度'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" name="count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <p>暂无活动数据</p>
              </div>
            )}
          </div>

          {/* 词云展示 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              关键词分析
            </h3>
            {wordCloudData.length > 0 ? (
              <div className="space-y-2 max-h-300 overflow-y-auto">
                {wordCloudData.map((word, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{word.text}</span>
                    <div className="flex items-center">
                      <div 
                        className="h-2 bg-blue-500 rounded mr-2" 
                        style={{ width: `${(word.value / Math.max(...wordCloudData.map(w => w.value))) * 100}px` }}
                      ></div>
                      <span className="text-xs text-gray-500">{word.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <p>暂无关键词数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysis;