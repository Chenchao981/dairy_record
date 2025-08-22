import React, { useState } from 'react';
import { Heart, Smile, Frown, Meh, Angry, Zap, Coffee, Music, Book, Users, Home, Briefcase, Dumbbell, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { emotionApi, CreateEmotionRequest } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useFormLoading } from '../hooks/useLoading';
import { LoadingSpinner } from '../components/Loading';

interface EmotionData {
  mood: string;
  intensity: number;
  activities: string[];
  description: string;
}

const EmotionRecord: React.FC = () => {
  const { user } = useAuthStore();
  const { handleError, handleFormError } = useErrorHandler();
  const { isFormLoading, setFormLoading } = useFormLoading('emotion-record');

  const [emotionData, setEmotionData] = useState<EmotionData>({
    mood: '',
    intensity: 5,
    activities: [],
    description: ''
  });

  // 心情选项
  const moodOptions = [
    { value: 'very_happy', label: '非常开心', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-50 hover:bg-pink-100' },
    { value: 'happy', label: '开心', icon: Smile, color: 'text-green-500', bgColor: 'bg-green-50 hover:bg-green-100' },
    { value: 'neutral', label: '平静', icon: Meh, color: 'text-gray-500', bgColor: 'bg-gray-50 hover:bg-gray-100' },
    { value: 'sad', label: '难过', icon: Frown, color: 'text-blue-500', bgColor: 'bg-blue-50 hover:bg-blue-100' },
    { value: 'angry', label: '愤怒', icon: Angry, color: 'text-red-500', bgColor: 'bg-red-50 hover:bg-red-100' }
  ];

  // 活动标签选项
  const activityOptions = [
    { value: 'work', label: '工作', icon: Briefcase },
    { value: 'exercise', label: '运动', icon: Dumbbell },
    { value: 'social', label: '社交', icon: Users },
    { value: 'family', label: '家庭', icon: Home },
    { value: 'study', label: '学习', icon: Book },
    { value: 'music', label: '音乐', icon: Music },
    { value: 'coffee', label: '咖啡', icon: Coffee },
    { value: 'travel', label: '旅行', icon: Plane },
    { value: 'relax', label: '放松', icon: Zap }
  ];

  const handleMoodSelect = (mood: string) => {
    setEmotionData(prev => ({ ...prev, mood }));
  };

  const handleActivityToggle = (activity: string) => {
    setEmotionData(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const handleIntensityChange = (intensity: number) => {
    setEmotionData(prev => ({ ...prev, intensity }));
  };

  const handleDescriptionChange = (description: string) => {
    setEmotionData(prev => ({ ...prev, description }));
  };

  const validateForm = (): boolean => {
    if (!emotionData.mood) {
      toast.error('请选择您的心情');
      return false;
    }

    if (!user) {
      toast.error('请先登录');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const requestData: CreateEmotionRequest = {
        mood: emotionData.mood,
        intensity: emotionData.intensity,
        activities: emotionData.activities,
        description: emotionData.description
      };

      const response = await emotionApi.create(requestData);

      if (response.success) {
        toast.success('情绪记录保存成功！');
        // 重置表单
        setEmotionData({
          mood: '',
          intensity: 5,
          activities: [],
          description: ''
        });
      } else {
        handleFormError(new Error(response.message || response.error || '保存失败'));
      }
    } catch (error) {
      handleFormError(error as Error);
    } finally {
      setFormLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 2) return 'text-red-500';
    if (intensity <= 4) return 'text-orange-500';
    if (intensity <= 6) return 'text-yellow-500';
    if (intensity <= 8) return 'text-green-500';
    return 'text-blue-500';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 2) return '很低';
    if (intensity <= 4) return '较低';
    if (intensity <= 6) return '中等';
    if (intensity <= 8) return '较高';
    return '很高';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">记录此刻心情</h1>
            <p className="text-gray-600 text-sm sm:text-base px-2">分享您的感受，让我们一起关注您的情绪健康</p>
          </div>

          {/* 心情选择器 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">您现在的心情如何？</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {moodOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = emotionData.mood === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMoodSelect(option.value)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 ${isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : `border-gray-200 ${option.bgColor}`
                      }`}
                  >
                    <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 ${option.color}`} />
                    <p className="text-xs sm:text-sm font-medium text-gray-700">{option.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 情绪强度 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">情绪强度</h2>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-600">很低</span>
                <span className={`text-base sm:text-lg font-bold ${getIntensityColor(emotionData.intensity)}`}>
                  {emotionData.intensity} - {getIntensityLabel(emotionData.intensity)}
                </span>
                <span className="text-xs sm:text-sm text-gray-600">很高</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={emotionData.intensity}
                onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <span key={num}>{num}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 活动标签 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">您在做什么？</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {activityOptions.map((activity) => {
                const IconComponent = activity.icon;
                const isSelected = emotionData.activities.includes(activity.value);
                return (
                  <button
                    key={activity.value}
                    onClick={() => handleActivityToggle(activity.value)}
                    className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 active:scale-95 ${isSelected
                      ? 'border-purple-500 bg-purple-100 text-purple-700'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium text-center">{activity.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 日记描述 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">想要分享更多吗？</h2>
            <textarea
              value={emotionData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="记录下您的想法、感受或今天发生的事情..."
              className="w-full h-24 sm:h-32 p-3 sm:p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* 提交按钮 */}
          <div className="text-center pt-2">
            <button
              onClick={handleSubmit}
              disabled={isFormLoading || !emotionData.mood}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 sm:transform sm:hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center"
            >
              {isFormLoading ? (
                <LoadingSpinner size="sm" text="保存中..." />
              ) : (
                '保存记录'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionRecord;