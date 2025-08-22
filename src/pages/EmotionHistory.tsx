import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, List, Eye, Heart, Smile, Frown, Meh, Angry, ChevronLeft, ChevronRight, Search, Filter, X, Download, Check, Square, CheckSquare, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { emotionApi, EmotionRecord } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useFormLoading } from '../hooks/useLoading';
import { LoadingSpinner } from '../components/Loading';
import { ExportModal } from '../components/ExportModal';



const EmotionHistory: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState<EmotionRecord | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 批量操作状态
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchOperation, setBatchOperation] = useState<'delete' | 'export' | null>(null);

  // 错误处理和加载状态
  const { handleError, handleFormError } = useErrorHandler();
  const { isFormLoading, setFormLoading } = useFormLoading('batch-operations');

  // 导出功能状态
  const [showExportModal, setShowExportModal] = useState(false);

  // 筛选和搜索状态
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    mood: '',
    intensityRange: [1, 10],
    activities: [] as string[],
    startDate: '',
    endDate: '',
    sortBy: 'created_at' as 'created_at' | 'intensity' | 'mood',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

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

  useEffect(() => {
    applyFilters();
  }, [records, searchTerm, filters]);

  const fetchEmotionRecords = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      const response = await emotionApi.getList({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (response.success && response.data) {
        setRecords(response.data.records || []);
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

  const applyFilters = () => {
    let filtered = [...records];

    // 文本搜索
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.activities.some(activity =>
          activityLabels[activity]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 心情筛选
    if (filters.mood) {
      filtered = filtered.filter(record => record.mood === filters.mood);
    }

    // 强度范围筛选
    filtered = filtered.filter(record =>
      record.intensity >= filters.intensityRange[0] &&
      record.intensity <= filters.intensityRange[1]
    );

    // 活动筛选
    if (filters.activities.length > 0) {
      filtered = filtered.filter(record =>
        filters.activities.some(activity => record.activities.includes(activity))
      );
    }

    // 日期范围筛选
    if (filters.startDate) {
      filtered = filtered.filter(record =>
        new Date(record.created_at) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(record =>
        new Date(record.created_at) <= new Date(filters.endDate)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'intensity':
          aValue = a.intensity;
          bValue = b.intensity;
          break;
        case 'mood':
          aValue = a.mood;
          bValue = b.mood;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      mood: '',
      intensityRange: [1, 10],
      activities: [],
      startDate: '',
      endDate: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const toggleActivity = (activity: string) => {
    setFilters(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  // 批量操作相关函数
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(record => record.id)));
    }
  };

  const toggleSelectRecord = (recordId: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (selectedIds.has(recordId)) {
      newSelectedIds.delete(recordId);
    } else {
      newSelectedIds.add(recordId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要删除的记录');
      return;
    }

    setBatchOperation('delete');
    setShowBatchConfirm(true);
  };

  const confirmBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setFormLoading(true);
      const deletePromises = Array.from(selectedIds).map(id => emotionApi.delete(id));
      await Promise.all(deletePromises);

      toast.success(`成功删除 ${selectedIds.size} 条记录`);
      setSelectedIds(new Set());
      setBatchMode(false);
      fetchEmotionRecords(); // 重新加载数据
    } catch (error) {
      handleFormError(error as Error);
    } finally {
      setFormLoading(false);
      setShowBatchConfirm(false);
      setBatchOperation(null);
    }
  };

  const handleBatchExport = () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要导出的记录');
      return;
    }

    const selectedRecords = filteredRecords.filter(record => selectedIds.has(record.id));
    exportSelectedData(selectedRecords);
  };

  const exportSelectedData = (records: EmotionRecord[]) => {
    const csvContent = [
      ['日期', '心情', '强度', '活动', '描述'].join(','),
      ...records.map(record => [
        new Date(record.created_at).toLocaleDateString('zh-CN'),
        moodIcons[record.mood as keyof typeof moodIcons]?.label || record.mood,
        record.intensity,
        record.activities.map(a => activityLabels[a] || a).join(';'),
        `"${record.description.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `selected-emotion-records-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(`成功导出 ${records.length} 条记录`);
  };

  // 增强的导出功能
  const showAdvancedExport = () => {
    setShowExportModal(true);
  };

  const handleExportData = (data: string, filename: string, format: string) => {
    let mimeType: string;
    let bom = '';

    switch (format) {
      case 'csv':
        mimeType = 'text/csv;charset=utf-8';
        bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        break;
      case 'json':
        mimeType = 'application/json;charset=utf-8';
        break;
      case 'txt':
        mimeType = 'text/plain;charset=utf-8';
        bom = '\uFEFF';
        break;
      default:
        mimeType = 'text/plain;charset=utf-8';
    }

    const blob = new Blob([bom + data], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理 URL 对象
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
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
    return filteredRecords.filter(record =>
      record.created_at.split('T')[0] === date
    );
  };

  const exportData = () => {
    const csvContent = [
      ['日期', '心情', '强度', '活动', '描述'].join(','),
      ...filteredRecords.map(record => [
        new Date(record.created_at).toLocaleDateString('zh-CN'),
        moodIcons[record.mood as keyof typeof moodIcons]?.label || record.mood,
        record.intensity,
        record.activities.map(a => activityLabels[a] || a).join(';'),
        `"${record.description.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emotion-records-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 可用的活动选项
  const availableActivities = useMemo(() => {
    const activities = new Set<string>();
    records.forEach(record => {
      record.activities.forEach(activity => activities.add(activity));
    });
    return Array.from(activities);
  }, [records]);

  // 统计信息
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const avgIntensity = total > 0
      ? (filteredRecords.reduce((sum, record) => sum + record.intensity, 0) / total).toFixed(1)
      : '0';
    const moodCounts = filteredRecords.reduce((acc, record) => {
      acc[record.mood] = (acc[record.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return { total, avgIntensity, mostCommonMood };
  }, [filteredRecords]);

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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">情绪历史</h1>
              <p className="text-gray-600">回顾您的情绪记录，发现情感模式</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>共 {stats.total} 条记录</span>
                <span>平均强度 {stats.avgIntensity}</span>
                {stats.mostCommonMood && (
                  <span>主要心情: {moodIcons[stats.mostCommonMood as keyof typeof moodIcons]?.label}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${showFilters
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
              >
                <Filter className="w-4 h-4" />
                筛选
              </button>

              {/* 批量操作按钮 */}
              <button
                onClick={toggleBatchMode}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${batchMode
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
              >
                {batchMode ? (
                  <>
                    <X className="w-4 h-4" />
                    退出批量
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    批量操作
                  </>
                )}
              </button>

              {/* 导出按钮组 */}
              <div className="relative group">
                <button
                  onClick={showAdvancedExport}
                  disabled={filteredRecords.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  高级导出
                </button>
              </div>

              {/* 视图切换 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  列表视图
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${viewMode === 'calendar'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  日历视图
                </button>
              </div>
            </div>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">筛选条件</h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    清空筛选
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 心情筛选 */}
                <div>
                  <label htmlFor="mood-filter" className="block text-sm font-medium text-gray-700 mb-2">心情</label>
                  <select
                    id="mood-filter"
                    value={filters.mood}
                    onChange={(e) => setFilters(prev => ({ ...prev, mood: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    aria-label="选择心情类型"
                  >
                    <option value="">所有心情</option>
                    {Object.entries(moodIcons).map(([mood, info]) => (
                      <option key={mood} value={mood}>{info.label}</option>
                    ))}
                  </select>
                </div>

                {/* 日期范围 */}
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
                  <input
                    id="start-date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    aria-label="选择开始日期"
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
                  <input
                    id="end-date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    aria-label="选择结束日期"
                  />
                </div>

                {/* 强度范围 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    强度范围: {filters.intensityRange[0]} - {filters.intensityRange[1]}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={filters.intensityRange[0]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        intensityRange: [Number(e.target.value), prev.intensityRange[1]]
                      }))}
                      className="flex-1"
                      aria-label="最小强度"
                      title="最小强度"
                    />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={filters.intensityRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        intensityRange: [prev.intensityRange[0], Number(e.target.value)]
                      }))}
                      className="flex-1"
                      aria-label="最大强度"
                      title="最大强度"
                    />
                  </div>
                </div>

                {/* 排序选项 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                  <div className="flex gap-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      aria-label="排序方式"
                    >
                      <option value="created_at">日期</option>
                      <option value="intensity">强度</option>
                      <option value="mood">心情</option>
                    </select>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      aria-label="排序顺序"
                    >
                      <option value="desc">降序</option>
                      <option value="asc">升序</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 活动筛选 */}
              {availableActivities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">活动</label>
                  <div className="flex flex-wrap gap-2">
                    {availableActivities.map(activity => (
                      <button
                        key={activity}
                        onClick={() => toggleActivity(activity)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${filters.activities.includes(activity)
                          ? 'bg-purple-200 text-purple-800 border border-purple-300'
                          : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                          }`}
                      >
                        {activityLabels[activity] || activity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 批量操作工具栏 */}
          {batchMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {selectedIds.size === filteredRecords.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        取消全选
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        全选
                      </>
                    )}
                  </button>

                  <span className="text-sm text-blue-700">
                    已选择 {selectedIds.size} 条记录
                  </span>
                </div>

                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBatchExport}
                      disabled={isFormLoading}
                      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      导出选中
                    </button>

                    <button
                      onClick={handleBatchDelete}
                      disabled={isFormLoading}
                      className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isFormLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          删除选中
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'list' ? (
            /* 列表视图 */
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {records.length === 0 ? '还没有情绪记录' : '没有匹配的记录'}
                  </p>
                  <p className="text-gray-400">
                    {records.length === 0 ? '开始记录您的第一个心情吧！' : '尝试调整筛选条件'}
                  </p>
                  {records.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      清空筛选
                    </button>
                  )}
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const moodInfo = moodIcons[record.mood as keyof typeof moodIcons];
                  const IconComponent = moodInfo?.icon || Heart;

                  return (
                    <div
                      key={record.id}
                      className={`bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 border-2 ${batchMode && selectedIds.has(record.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          {/* 批量选择框 */}
                          {batchMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectRecord(record.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {selectedIds.has(record.id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          )}
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

                        {!batchMode && (
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </button>
                        )}
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
                  title="上个月"
                  aria-label="上个月"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="下个月"
                  aria-label="下个月"
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
                      className={`p-2 h-20 border rounded-lg cursor-pointer transition-colors ${day.isCurrentMonth
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
                    {formatDate(selectedDate)} 的记录 ({getRecordsForDate(selectedDate).length} 条)
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

      {/* 批量删除确认对话框 */}
      {showBatchConfirm && batchOperation === 'delete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-6">
                您确定要删除选中的 {selectedIds.size} 条情绪记录吗？
                <br />
                <span className="text-red-600 text-sm">此操作无法撤销</span>
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowBatchConfirm(false);
                    setBatchOperation(null);
                  }}
                  disabled={isFormLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  取消
                </button>

                <button
                  onClick={confirmBatchDelete}
                  disabled={isFormLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isFormLoading ? (
                    <LoadingSpinner size="sm" text="删除中..." />
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 导出模态框 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        records={records}
        filteredRecords={filteredRecords}
        onExport={handleExportData}
      />
    </div>
  );
};

export default EmotionHistory;