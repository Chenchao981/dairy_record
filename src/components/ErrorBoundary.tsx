import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });

        // 在生产环境中，您可能想要将错误发送到错误跟踪服务
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
            }

            return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} />;
        }

        return this.props.children;
    }
}

// 默认错误回退组件
const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">出现了一些问题</h1>
                <p className="text-gray-600 mb-6">
                    很抱歉，应用遇到了一个错误。我们正在努力修复这个问题。
                </p>

                {isDevelopment && error && (
                    <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">错误详情：</h3>
                        <code className="text-xs text-red-600 break-all">
                            {error.message}
                        </code>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={retry}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        重新尝试
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        刷新页面
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;
export { DefaultErrorFallback };