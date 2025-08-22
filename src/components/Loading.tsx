import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    overlay?: boolean;
    className?: string;
}

// 基础加载动画组件
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    overlay = false,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    const spinner = (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2 className={`animate-spin ${sizeClasses[size]} text-purple-600`} />
            {text && (
                <span className={`ml-3 text-gray-600 ${textSizeClasses[size]}`}>
                    {text}
                </span>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    {spinner}
                </div>
            </div>
        );
    }

    return spinner;
};

// 页面级加载组件
export const PageLoading: React.FC<{ text?: string }> = ({ text = '加载中...' }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">正在加载</h2>
                <p className="text-gray-600">{text}</p>
            </div>
        </div>
    );
};

// 内容区域加载组件
export const ContentLoading: React.FC<{ text?: string; height?: string }> = ({
    text = '加载中...',
    height = 'h-64'
}) => {
    return (
        <div className={`${height} flex items-center justify-center bg-gray-50 rounded-xl`}>
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
                <p className="text-gray-600">{text}</p>
            </div>
        </div>
    );
};

// 骨架屏组件
export const SkeletonLoading: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className = ''
}) => {
    return (
        <div className={`animate-pulse ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <div
                    key={index}
                    className={`h-4 bg-gray-200 rounded mb-3 ${index === lines - 1 ? 'w-3/4' : 'w-full'
                        }`}
                />
            ))}
        </div>
    );
};

// 卡片骨架屏
export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
        </div>
    );
};

// 表格骨架屏
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* 表头 */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex space-x-4">
                    {Array.from({ length: columns }).map((_, index) => (
                        <div
                            key={index}
                            className="h-4 bg-gray-200 rounded animate-pulse flex-1"
                        />
                    ))}
                </div>
            </div>

            {/* 表格行 */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="px-6 py-4 border-b border-gray-200">
                    <div className="flex space-x-4">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div
                                key={colIndex}
                                className="h-4 bg-gray-200 rounded animate-pulse flex-1"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};