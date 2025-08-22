import React, { useState } from 'react';
import { Download, FileText, Database, Image, Calendar, Filter, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { EmotionRecord } from '../services/api';
import { useFormLoading } from '../hooks/useLoading';
import { LoadingSpinner } from './Loading';

interface ExportOptions {
    format: 'csv' | 'json' | 'pdf' | 'txt';
    dateRange: 'all' | 'lastWeek' | 'lastMonth' | 'lastYear' | 'custom';
    startDate?: string;
    endDate?: string;
    includeFields: {
        date: boolean;
        mood: boolean;
        intensity: boolean;
        activities: boolean;
        description: boolean;
        statistics: boolean;
    };
    includeCharts: boolean;
    groupBy: 'none' | 'date' | 'mood' | 'week' | 'month';
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: EmotionRecord[];
    filteredRecords: EmotionRecord[];
    onExport: (data: any, filename: string, format: string) => void;
}

// 心情标签映射
const moodLabels: { [key: string]: string } = {
    very_happy: '非常开心',
    happy: '开心',
    neutral: '平静',
    sad: '难过',
    angry: '愤怒'
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

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    records,
    filteredRecords,
    onExport
}) => {
    const { isFormLoading, setFormLoading } = useFormLoading('data-export');

    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'csv',
        dateRange: 'all',
        includeFields: {
            date: true,
            mood: true,
            intensity: true,
            activities: true,
            description: true,
            statistics: false
        },
        includeCharts: false,
        groupBy: 'none'
    });

    if (!isOpen) return null;

    const getDateFilteredRecords = (): EmotionRecord[] => {
        let filtered = filteredRecords;
        const now = new Date();

        switch (exportOptions.dateRange) {
            case 'lastWeek':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(r => new Date(r.created_at) >= weekAgo);
                break;
            case 'lastMonth':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(r => new Date(r.created_at) >= monthAgo);
                break;
            case 'lastYear':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(r => new Date(r.created_at) >= yearAgo);
                break;
            case 'custom':
                if (exportOptions.startDate && exportOptions.endDate) {
                    const start = new Date(exportOptions.startDate);
                    const end = new Date(exportOptions.endDate);
                    filtered = filtered.filter(r => {
                        const recordDate = new Date(r.created_at);
                        return recordDate >= start && recordDate <= end;
                    });
                }
                break;
            default:
                // 'all' - 使用所有已过滤的记录
                break;
        }

        return filtered;
    };

    const generateStatistics = (data: EmotionRecord[]) => {
        const moodCount = data.reduce((acc, record) => {
            acc[record.mood] = (acc[record.mood] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const avgIntensity = data.length > 0
            ? (data.reduce((sum, record) => sum + record.intensity, 0) / data.length).toFixed(2)
            : '0';

        const activityCount = data.reduce((acc, record) => {
            record.activities.forEach(activity => {
                acc[activity] = (acc[activity] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>);

        return {
            totalRecords: data.length,
            avgIntensity,
            moodDistribution: moodCount,
            topActivities: Object.entries(activityCount)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([activity, count]) => ({ activity: activityLabels[activity] || activity, count }))
        };
    };

    const groupRecords = (data: EmotionRecord[]) => {
        if (exportOptions.groupBy === 'none') return { ungrouped: data };

        const grouped = data.reduce((acc, record) => {
            let key: string;
            const date = new Date(record.created_at);

            switch (exportOptions.groupBy) {
                case 'date':
                    key = date.toLocaleDateString('zh-CN');
                    break;
                case 'mood':
                    key = moodLabels[record.mood] || record.mood;
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.toLocaleDateString('zh-CN')} 周`;
                    break;
                case 'month':
                    key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
                    break;
                default:
                    key = 'ungrouped';
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(record);
            return acc;
        }, {} as Record<string, EmotionRecord[]>);

        return grouped;
    };

    const formatForExport = (data: EmotionRecord[]) => {
        const { includeFields } = exportOptions;

        return data.map(record => {
            const formatted: any = {};

            if (includeFields.date) {
                formatted['日期'] = new Date(record.created_at).toLocaleString('zh-CN');
            }
            if (includeFields.mood) {
                formatted['心情'] = moodLabels[record.mood] || record.mood;
            }
            if (includeFields.intensity) {
                formatted['强度'] = record.intensity;
            }
            if (includeFields.activities) {
                formatted['活动'] = record.activities.map(a => activityLabels[a] || a).join(', ');
            }
            if (includeFields.description) {
                formatted['描述'] = record.description;
            }

            return formatted;
        });
    };

    const handleExport = async () => {
        try {
            setFormLoading(true);

            const filteredData = getDateFilteredRecords();
            if (filteredData.length === 0) {
                toast.error('没有符合条件的数据可以导出');
                return;
            }

            const groupedData = groupRecords(filteredData);
            const statistics = exportOptions.includeFields.statistics ? generateStatistics(filteredData) : null;

            let exportData: any;
            let filename: string;

            const timestamp = new Date().toISOString().split('T')[0];

            switch (exportOptions.format) {
                case 'csv':
                    // CSV 格式
                    if (exportOptions.groupBy === 'none') {
                        const formatted = formatForExport(filteredData);
                        const headers = Object.keys(formatted[0] || {});
                        const csvContent = [
                            headers.join(','),
                            ...formatted.map(row => headers.map(header =>
                                `"${String(row[header]).replace(/"/g, '""')}"`
                            ).join(','))
                        ].join('\n');

                        exportData = csvContent;
                        filename = `emotion-records-${timestamp}.csv`;
                    } else {
                        // 分组 CSV
                        let csvContent = '';
                        Object.entries(groupedData).forEach(([group, records]) => {
                            csvContent += `\n=== ${group} ===\n`;
                            const formatted = formatForExport(records);
                            if (formatted.length > 0) {
                                const headers = Object.keys(formatted[0]);
                                csvContent += headers.join(',') + '\n';
                                csvContent += formatted.map(row => headers.map(header =>
                                    `"${String(row[header]).replace(/"/g, '""')}"`
                                ).join(',')).join('\n') + '\n';
                            }
                        });
                        exportData = csvContent;
                        filename = `emotion-records-grouped-${timestamp}.csv`;
                    }
                    break;

                case 'json':
                    // JSON 格式
                    exportData = JSON.stringify({
                        exportInfo: {
                            timestamp: new Date().toISOString(),
                            totalRecords: filteredData.length,
                            dateRange: exportOptions.dateRange,
                            groupBy: exportOptions.groupBy
                        },
                        statistics,
                        data: exportOptions.groupBy === 'none'
                            ? formatForExport(filteredData)
                            : Object.entries(groupedData).reduce((acc, [group, records]) => {
                                acc[group] = formatForExport(records);
                                return acc;
                            }, {} as Record<string, any[]>)
                    }, null, 2);
                    filename = `emotion-records-${timestamp}.json`;
                    break;

                case 'txt':
                    // 纯文本格式
                    let textContent = `情绪记录导出报告\n`;
                    textContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
                    textContent += `记录数量: ${filteredData.length}\n`;
                    textContent += `数据范围: ${exportOptions.dateRange === 'all' ? '全部' : exportOptions.dateRange}\n\n`;

                    if (statistics) {
                        textContent += `=== 统计信息 ===\n`;
                        textContent += `总记录数: ${statistics.totalRecords}\n`;
                        textContent += `平均强度: ${statistics.avgIntensity}\n`;
                        textContent += `心情分布:\n`;
                        Object.entries(statistics.moodDistribution).forEach(([mood, count]) => {
                            textContent += `  ${moodLabels[mood] || mood}: ${count}\n`;
                        });
                        textContent += `热门活动:\n`;
                        statistics.topActivities.forEach(({ activity, count }) => {
                            textContent += `  ${activity}: ${count}\n`;
                        });
                        textContent += `\n`;
                    }

                    textContent += `=== 详细记录 ===\n`;
                    Object.entries(groupedData).forEach(([group, records]) => {
                        if (exportOptions.groupBy !== 'none') {
                            textContent += `\n--- ${group} ---\n`;
                        }
                        records.forEach((record, index) => {
                            textContent += `${index + 1}. ${new Date(record.created_at).toLocaleString('zh-CN')}\n`;
                            textContent += `   心情: ${moodLabels[record.mood] || record.mood} (强度: ${record.intensity})\n`;
                            if (record.activities.length > 0) {
                                textContent += `   活动: ${record.activities.map(a => activityLabels[a] || a).join(', ')}\n`;
                            }
                            if (record.description) {
                                textContent += `   描述: ${record.description}\n`;
                            }
                            textContent += `\n`;
                        });
                    });

                    exportData = textContent;
                    filename = `emotion-records-${timestamp}.txt`;
                    break;

                default:
                    throw new Error('不支持的导出格式');
            }

            onExport(exportData, filename, exportOptions.format);
            onClose();
            toast.success(`成功导出 ${filteredData.length} 条记录`);

        } catch (error) {
            console.error('导出失败:', error);
            toast.error('导出失败，请重试');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* 标题 */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <Download className="w-6 h-6 mr-2" />
                            数据导出
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            title="关闭导出对话框"
                            aria-label="关闭"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* 导出格式 */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">导出格式</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: 'csv', label: 'CSV', icon: Database, desc: '表格数据' },
                                    { value: 'json', label: 'JSON', icon: FileText, desc: '结构化数据' },
                                    { value: 'txt', label: 'TXT', icon: FileText, desc: '纯文本' },
                                ].map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                                        className={`p-4 rounded-xl border-2 transition-all ${exportOptions.format === format.value
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <format.icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                                        <div className="text-sm font-medium">{format.label}</div>
                                        <div className="text-xs text-gray-500">{format.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 数据范围 */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">数据范围</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                {[
                                    { value: 'all', label: '全部数据' },
                                    { value: 'lastWeek', label: '最近一周' },
                                    { value: 'lastMonth', label: '最近一月' },
                                    { value: 'custom', label: '自定义' }
                                ].map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => setExportOptions(prev => ({ ...prev, dateRange: range.value as any }))}
                                        className={`p-3 rounded-lg border-2 transition-all text-sm ${exportOptions.dateRange === range.value
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>

                            {exportOptions.dateRange === 'custom' && (
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                                        <input
                                            type="date"
                                            value={exportOptions.startDate || ''}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                            title="选择开始日期"
                                            aria-label="开始日期"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                                        <input
                                            type="date"
                                            value={exportOptions.endDate || ''}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                            title="选择结束日期"
                                            aria-label="结束日期"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 包含字段 */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">包含字段</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'date', label: '日期时间' },
                                    { key: 'mood', label: '心情类型' },
                                    { key: 'intensity', label: '情绪强度' },
                                    { key: 'activities', label: '相关活动' },
                                    { key: 'description', label: '详细描述' },
                                    { key: 'statistics', label: '统计信息' }
                                ].map((field) => (
                                    <label key={field.key} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.includeFields[field.key as keyof typeof exportOptions.includeFields]}
                                            onChange={(e) => setExportOptions(prev => ({
                                                ...prev,
                                                includeFields: {
                                                    ...prev.includeFields,
                                                    [field.key]: e.target.checked
                                                }
                                            }))}
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm">{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 分组方式 */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">分组方式</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { value: 'none', label: '不分组' },
                                    { value: 'date', label: '按日期' },
                                    { value: 'mood', label: '按心情' },
                                    { value: 'week', label: '按周' },
                                    { value: 'month', label: '按月' }
                                ].map((group) => (
                                    <button
                                        key={group.value}
                                        onClick={() => setExportOptions(prev => ({ ...prev, groupBy: group.value as any }))}
                                        className={`p-2 rounded-lg border-2 transition-all text-sm ${exportOptions.groupBy === group.value
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {group.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 预览信息 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-2">导出预览</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <div>将要导出: {getDateFilteredRecords().length} 条记录</div>
                                <div>格式: {exportOptions.format.toUpperCase()}</div>
                                <div>分组: {exportOptions.groupBy === 'none' ? '不分组' : `按${exportOptions.groupBy}分组`}</div>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex space-x-3 pt-4">
                            <button
                                onClick={onClose}
                                disabled={isFormLoading}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                取消
                            </button>

                            <button
                                onClick={handleExport}
                                disabled={isFormLoading || getDateFilteredRecords().length === 0}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {isFormLoading ? (
                                    <LoadingSpinner size="sm" text="导出中..." />
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        开始导出
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};