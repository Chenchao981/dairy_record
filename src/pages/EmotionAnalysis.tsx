import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Filter, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { emotionApi, EmotionRecord } from '../services/api';
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
  ResponsiveContainer,
  Area,
  AreaChart,
  ScatterChart,
  Scatter
} from 'recharts';



interface ActivityIntensityData {
  activity: string;
  veryHappy: number;
  happy: number;
  neutral: number;
  sad: number;
  angry: number;
}

interface HourlyData {
  hour: string;
  count: number;
  avgIntensity: number;
}

interface WeekdayData {
  weekday: string;
  count: number;
  avgIntensity: number;
}

interface TrendData {
  date: string;
  intensity: number;
  mood: string;
  count: number;
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
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [chartType, setChartType] = useState<'line' | 'area' | 'scatter'>('line');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [moodDistribution, setMoodDistribution] = useState<MoodDistribution[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [activityIntensityData, setActivityIntensityData] = useState<ActivityIntensityData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [weekdayData, setWeekdayData] = useState<WeekdayData[]>([]);
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
  }, [timeRange]);

  useEffect(() => {
    if (records.length > 0) {
      processAnalyticsData();
    }
  }, [records]);

  const fetchEmotionRecords = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      setRefreshing(true);
      const params: any = {};

      if (timeRange !== 'all') {
        const now = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        params.startDate = startDate.toISOString().split('T')[0];
      }

      const response = await emotionApi.getList(params);

      if (response.success && response.data) {
        setRecords(response.data.records || []);
      } else {
        toast.error('获取数据失败');
      }
    } catch (error) {
      console.error('获取情绪记录失败:', error);
      toast.error('网络错误，请检查连接');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredRecords = () => {
    return records; // 已经在API调用中过滤
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
        mood: data.moods[0], // 取第一个心情作为代表
        count: data.count
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

    // 处理活动与情绪关联分析
    const activityMoodMap = new Map<string, { [mood: string]: number }>();
    filteredRecords.forEach(record => {
      record.activities.forEach(activity => {
        if (!activityMoodMap.has(activity)) {
          activityMoodMap.set(activity, {
            very_happy: 0, happy: 0, neutral: 0, sad: 0, angry: 0
          });
        }
        const activityMoodData = activityMoodMap.get(activity)!;
        activityMoodData[record.mood] = (activityMoodData[record.mood] || 0) + 1;
      });
    });

    const activityIntensityArray = Array.from(activityMoodMap.entries())
      .map(([activity, moods]) => ({
        activity: activityLabels[activity] || activity,
        veryHappy: moods.very_happy || 0,
        happy: moods.happy || 0,
        neutral: moods.neutral || 0,
        sad: moods.sad || 0,
        angry: moods.angry || 0
      }))
      .filter(item => (item.veryHappy + item.happy + item.neutral + item.sad + item.angry) >= 2) // 至少2次记录
      .slice(0, 8);

    setActivityIntensityData(activityIntensityArray);

    // 处理时间模式分析
    const hourMap = new Map<number, { count: number; totalIntensity: number }>();
    const weekdayMap = new Map<number, { count: number; totalIntensity: number }>();

    filteredRecords.forEach(record => {
      const date = new Date(record.created_at);
      const hour = date.getHours();
      const weekday = date.getDay();

      // 时段分析
      if (!hourMap.has(hour)) {
        hourMap.set(hour, { count: 0, totalIntensity: 0 });
      }
      const hourData = hourMap.get(hour)!;
      hourData.count += 1;
      hourData.totalIntensity += record.intensity;

      // 星期分析
      if (!weekdayMap.has(weekday)) {
        weekdayMap.set(weekday, { count: 0, totalIntensity: 0 });
      }
      const weekdayData = weekdayMap.get(weekday)!;
      weekdayData.count += 1;
      weekdayData.totalIntensity += record.intensity;
    });

    const hourArray = Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour: `${hour}:00`,
        count: data.count,
        avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    setHourlyData(hourArray);

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayArray = Array.from(weekdayMap.entries())
      .map(([weekday, data]) => ({
        weekday: weekdays[weekday],
        count: data.count,
        avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10
      }))
      .sort((a, b) => weekdays.indexOf(a.weekday) - weekdays.indexOf(b.weekday));

    setWeekdayData(weekdayArray);

    // 处理词云数据（基于描述文本）
    const wordCount = new Map<string, number>();
    filteredRecords.forEach(record => {
      if (record.description) {
        // 简单的中文分词（实际项目中可能需要更复杂的分词库）
        const words = record.description
          .replace(/[，。！？；：、]/g, ' ')
          .split(' ')
          .filter(word => word.length > 1 && word.length < 6); // 过滤长度

        words.forEach(word => {
          wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });
      }
    });

    const wordCloudArray = Array.from(wordCount.entries())
      .map(([text, value]) => ({ text, value }))
      .filter(item => item.value >= 2) // 至少出现2次
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    setWordCloudData(wordCloudArray);
  };

  const exportAnalyticsData = () => {
    const data = {
      summary: {
        totalRecords: getFilteredRecords().length,
        avgIntensity: getFilteredRecords().length > 0
          ? (getFilteredRecords().reduce((sum, r) => sum + r.intensity, 0) / getFilteredRecords().length).toFixed(1)
          : '0',
        activeDays: trendData.length,
        moodTypes: moodDistribution.length
      },
      trendData,
      moodDistribution,
      activityStats,
      activityIntensityData,
      hourlyData,
      weekdayData,
      wordCloudData
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emotion-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和时间范围选择器 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">情绪分析</h1>
              <p className="text-sm sm:text-base text-gray-600">深入了解你的情绪模式和趋势</p>
            </div>
            <div className="mt-2 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm sm:text-base"
                aria-label="选择时间范围"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">总记录数</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{getFilteredRecords().length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">平均强度</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {getFilteredRecords().length > 0
                    ? (getFilteredRecords().reduce((sum, r) => sum + r.intensity, 0) / getFilteredRecords().length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">活跃天数</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{trendData.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">心情类型</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{moodDistribution.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* 情绪趋势图 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              情绪强度趋势
            </h3>
            {trendData.length > 0 ? (
              <div>
                {chartType === 'line' && (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                        formatter={(value: any, name: string) => {
                          if (name === 'intensity') return [value, '强度'];
                          if (name === 'count') return [value, '记录数'];
                          return [value, name];
                        }}
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
                )}
                {chartType === 'area' && (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                        formatter={(value: any) => [value, '强度']}
                      />
                      <Area
                        type="monotone"
                        dataKey="intensity"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {chartType === 'scatter' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={trendData}>
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
                      <Scatter
                        dataKey="intensity"
                        fill="#8b5cf6"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

        {/* 活动与情绪关联分析 */}
        {activityIntensityData.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
              活动与情绪关联分析
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={activityIntensityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="activity"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="veryHappy" stackId="a" fill="#ec4899" name="非常开心" />
                <Bar dataKey="happy" stackId="a" fill="#10b981" name="开心" />
                <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="平静" />
                <Bar dataKey="sad" stackId="a" fill="#3b82f6" name="难过" />
                <Bar dataKey="angry" stackId="a" fill="#ef4444" name="愤怒" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 时间模式分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 时段分析 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              时段分析
            </h3>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'count') return [value, '记录数'];
                      if (name === 'avgIntensity') return [value, '平均强度'];
                      return [value, name];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <p>暂无时段数据</p>
              </div>
            )}
          </div>

          {/* 星期分析 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              星期分析
            </h3>
            {weekdayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekdayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekday" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'count') return [value, '记录数'];
                      if (name === 'avgIntensity') return [value, '平均强度'];
                      return [value, name];
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    fill="#8884d8"
                    name="count"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgIntensity"
                    fill="#82ca9d"
                    name="avgIntensity"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <p>暂无星期数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysis;