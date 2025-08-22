import React, { useState, useEffect } from 'react';
import { Calendar, List, Eye, Heart, Smile, Frown, Meh, Angry, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';

interface EmotionRecord {
  id: number;
  mood: string;
  intensity: number;
  activities: string[];
  description: string;
  created_at: string;
}

const EmotionHistory: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState<EmotionRecord | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 心情图标映射
  const moodIcons = {
    very_happy: { icon: Heart, color: 'text-pink-500', label: '非常开心' },
    happy: { icon: Smile, color: 'text-green-500', label: '开心' },
    neutral: { icon: Meh, color: 'text-gray-500', label: '平静' },
    sad: { icon: Frown, color: 'text-blue-500', label: '难过' },
    angry: { icon: Angry, color: 'text-red-500', label: '愤怒' }
  };

  // 活动标签映射
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
        toast.error('获取记录失败');
      }
    } catch (error) {
      console.error('获取情绪记录失败:', error);
      toast.error('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 2) return 'bg-red-100 text-red-800';
    if (intensity <= 4) return 'bg-orange-100 text-orange-800';
    if (intensity <= 6) return 'bg-yellow-100 text-yellow-800';
    if (intensity <= 8) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getRecordsForDate = (date: string) => {
    return records.filter(record => 
      record.created_at.split('T')[0] === date
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 添加上个月的日期
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        fullDate: prevDate.toISOString().split('T')[0]
      });
    }
    
    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: currentDate.toISOString().split('T')[0]
      });
    }
    
    // 添加下个月的日期以填满6周
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: nextDate.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">情绪历史</h1>
              <p className="text-gray-600">回顾您的情绪记录，发现情感模式</p>
            </div>
            
            {/* 视图切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                列表视图
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                日历视图
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            /* 列表视图 */
            <div className="space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">还没有情绪记录</p>
                  <p className="text-gray-400">开始记录您的第一个心情吧！</p>
                </div>
              ) : (
                records.map((record) => {
                  const moodInfo = moodIcons[record.mood as keyof typeof moodIcons];
                  const IconComponent = moodInfo?.icon || Heart;
                  
                  return (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <IconComponent className={`w-8 h-8 ${moodInfo?.color || 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {moodInfo?.label || '未知心情'}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(record.intensity)}`}>
                                强度 {record.intensity}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{formatDate(record.created_at)} {formatTime(record.created_at)}</p>
                            {record.activities.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {record.activities.map((activity, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs"
                                  >
                                    {activityLabels[activity] || activity}
                                  </span>
                                ))}
                              </div>
                            )}
                            {record.description && (
                              <p className="text-gray-700 line-clamp-2">{record.description}</p>
                            )}
                          </div>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* 日历视图 */
            <div>
              {/* 日历头部 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日历网格 */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((day, index) => {
                  const dayRecords = getRecordsForDate(day.fullDate);
                  const hasRecords = dayRecords.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 h-20 border rounded-lg cursor-pointer transition-colors ${
                        day.isCurrentMonth
                          ? hasRecords
                            ? 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}
                      onClick={() => {
                        if (hasRecords) {
                          setSelectedDate(day.fullDate);
                        }
                      }}
                    >
                      <div className="text-sm font-medium mb-1">{day.date}</div>
                      {hasRecords && (
                        <div className="flex flex-wrap gap-1">
                          {dayRecords.slice(0, 3).map((record, recordIndex) => {
                            const moodInfo = moodIcons[record.mood as keyof typeof moodIcons];
                            const IconComponent = moodInfo?.icon || Heart;
                            return (
                              <IconComponent
                                key={recordIndex}
                                className={`w-3 h-3 ${moodInfo?.color || 'text-gray-500'}`}
                              />
                            );
                          })}
                          {dayRecords.length > 3 && (
                            <span className="text-xs text-gray-500">+{dayRecords.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 选中日期的记录 */}
              {selectedDate && getRecordsForDate(selectedDate).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {formatDate(selectedDate)} 的记录
                  </h3>
                  <div className="space-y-3">
                    {getRecordsForDate(selectedDate).map((record) => {
                      const moodInfo = moodIcons[record.mood as keyof typeof moodIcons];
                      const IconComponent = moodInfo?.icon || Heart;
                      
                      return (
                        <div
                          key={record.id}
                          className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <div className="flex items-center space-x-3">
                            <IconComponent className={`w-6 h-6 ${moodInfo?.color || 'text-gray-500'}`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{moodInfo?.label || '未知心情'}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${getIntensityColor(record.intensity)}`}>
                                  {record.intensity}
                                </span>
                                <span className="text-sm text-gray-500">{formatTime(record.created_at)}</span>
                              </div>
                              {record.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{record.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 详情模态框 */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">情绪详情</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* 心情和时间 */}
                <div className="flex items-center space-x-4">
                  {(() => {
                    const moodInfo = moodIcons[selectedRecord.mood as keyof typeof moodIcons];
                    const IconComponent = moodInfo?.icon || Heart;
                    return <IconComponent className={`w-12 h-12 ${moodInfo?.color || 'text-gray-500'}`} />;
                  })()}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {moodIcons[selectedRecord.mood as keyof typeof moodIcons]?.label || '未知心情'}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(selectedRecord.created_at)} {formatTime(selectedRecord.created_at)}
                    </p>
                  </div>
                </div>

                {/* 情绪强度 */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">情绪强度</h4>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedRecord.intensity * 10}%` }}
                      ></div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getIntensityColor(selectedRecord.intensity)}`}>
                      {selectedRecord.intensity}/10
                    </span>
                  </div>
                </div>

                {/* 活动标签 */}
                {selectedRecord.activities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">相关活动</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.activities.map((activity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {activityLabels[activity] || activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 描述 */}
                {selectedRecord.description && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">详细描述</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">{selectedRecord.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionHistory;