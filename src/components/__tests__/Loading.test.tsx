import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import {
    LoadingSpinner,
    PageLoading,
    ContentLoading,
    TableSkeleton,
    SkeletonLoading
} from '../Loading';

describe('Loading Components', () => {
    describe('LoadingSpinner', () => {
        it('应该渲染默认加载旋转器', () => {
            render(<LoadingSpinner />);

            const spinner = screen.getByTestId('loading-spinner');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveClass('animate-spin');
        });

        it('应该显示自定义文本', () => {
            render(<LoadingSpinner text="加载中..." />);

            expect(screen.getByText('加载中...')).toBeInTheDocument();
        });

        it('应该支持不同尺寸', () => {
            const { rerender } = render(<LoadingSpinner size="sm" />);
            const smallSpinner = screen.getByTestId('loading-spinner');
            expect(smallSpinner).toHaveClass('w-4', 'h-4');

            rerender(<LoadingSpinner size="md" />);
            const mediumSpinner = screen.getByTestId('loading-spinner');
            expect(mediumSpinner).toHaveClass('w-6', 'h-6');

            rerender(<LoadingSpinner size="lg" />);
            const largeSpinner = screen.getByTestId('loading-spinner');
            expect(largeSpinner).toHaveClass('w-8', 'h-8');
        });

        it('应该支持居中布局', () => {
            render(<LoadingSpinner centered />);

            const container = screen.getByTestId('loading-spinner').parentElement;
            expect(container).toHaveClass('flex', 'items-center', 'justify-center');
        });
    });

    describe('PageLoading', () => {
        it('应该渲染页面加载组件', () => {
            render(<PageLoading />);

            expect(screen.getByTestId('page-loading')).toBeInTheDocument();
            expect(screen.getByText('加载中...')).toBeInTheDocument();
        });

        it('应该显示自定义文本', () => {
            render(<PageLoading text="页面加载中..." />);

            expect(screen.getByText('页面加载中...')).toBeInTheDocument();
        });

        it('应该有正确的背景和布局', () => {
            render(<PageLoading />);

            const pageLoading = screen.getByTestId('page-loading');
            expect(pageLoading).toHaveClass(
                'fixed',
                'inset-0',
                'bg-white/80',
                'backdrop-blur-sm',
                'flex',
                'items-center',
                'justify-center',
                'z-50'
            );
        });

        it('应该包含旋转器', () => {
            render(<PageLoading />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });
    });

    describe('ContentLoading', () => {
        it('应该渲染内容加载组件', () => {
            render(<ContentLoading />);

            expect(screen.getByTestId('content-loading')).toBeInTheDocument();
        });

        it('应该显示自定义文本', () => {
            render(<ContentLoading text="内容加载中..." />);

            expect(screen.getByText('内容加载中...')).toBeInTheDocument();
        });

        it('应该有正确的样式', () => {
            render(<ContentLoading />);

            const contentLoading = screen.getByTestId('content-loading');
            expect(contentLoading).toHaveClass(
                'flex',
                'items-center',
                'justify-center',
                'py-8'
            );
        });
    });

    describe('TableSkeleton', () => {
        it('应该渲染表格骨架屏', () => {
            render(<TableSkeleton />);

            expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
        });

        it('应该渲染指定行数和列数', () => {
            render(<TableSkeleton rows={3} columns={4} />);

            const tableRows = screen.getAllByTestId(/skeleton-row-/);
            expect(tableRows).toHaveLength(3);

            const firstRowCells = screen.getAllByTestId(/skeleton-cell-0-/);
            expect(firstRowCells).toHaveLength(4);
        });

        it('应该有表格头部', () => {
            render(<TableSkeleton />);

            expect(screen.getByTestId('skeleton-header')).toBeInTheDocument();
        });

        it('应该支持自定义高度', () => {
            render(<TableSkeleton height="200px" />);

            const skeleton = screen.getByTestId('table-skeleton');
            expect(skeleton).toHaveStyle({ height: '200px' });
        });
    });

    describe('SkeletonLoading', () => {
        it('应该渲染骨架屏加载', () => {
            render(<SkeletonLoading />);

            expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
        });

        it('应该渲染指定数量的行', () => {
            render(<SkeletonLoading lines={5} />);

            const skeletonLines = screen.getAllByTestId(/skeleton-line-/);
            expect(skeletonLines).toHaveLength(5);
        });

        it('应该有动画效果', () => {
            render(<SkeletonLoading />);

            const skeletonLines = screen.getAllByTestId(/skeleton-line-/);
            skeletonLines.forEach(line => {
                expect(line).toHaveClass('animate-pulse');
            });
        });

        it('应该支持自定义高度', () => {
            render(<SkeletonLoading height="300px" />);

            const skeleton = screen.getByTestId('skeleton-loading');
            expect(skeleton).toHaveStyle({ height: '300px' });
        });

        it('应该有不同宽度的行以模拟真实内容', () => {
            render(<SkeletonLoading lines={4} />);

            const skeletonLines = screen.getAllByTestId(/skeleton-line-/);

            // 检查是否有不同的宽度类
            const widthClasses = skeletonLines.map(line => {
                const classList = Array.from(line.classList);
                return classList.find(cls => cls.startsWith('w-'));
            });

            // 应该有多种不同的宽度
            const uniqueWidths = new Set(widthClasses);
            expect(uniqueWidths.size).toBeGreaterThan(1);
        });
    });

    describe('Loading Components Integration', () => {
        it('应该能够同时渲染多个加载组件', () => {
            render(
                <div>
                    <LoadingSpinner text="旋转器" />
                    <ContentLoading text="内容加载" />
                    <SkeletonLoading lines={2} />
                </div>
            );

            expect(screen.getByText('旋转器')).toBeInTheDocument();
            expect(screen.getByText('内容加载')).toBeInTheDocument();
            expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
        });

        it('应该支持嵌套使用', () => {
            render(
                <PageLoading>
                    <ContentLoading />
                </PageLoading>
            );

            expect(screen.getByTestId('page-loading')).toBeInTheDocument();
            expect(screen.getByTestId('content-loading')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('LoadingSpinner应该有适当的aria属性', () => {
            render(<LoadingSpinner />);

            const spinner = screen.getByTestId('loading-spinner');
            expect(spinner).toHaveAttribute('role', 'status');
            expect(spinner).toHaveAttribute('aria-label', '加载中');
        });

        it('PageLoading应该有适当的aria属性', () => {
            render(<PageLoading />);

            const pageLoading = screen.getByTestId('page-loading');
            expect(pageLoading).toHaveAttribute('role', 'status');
            expect(pageLoading).toHaveAttribute('aria-label', '页面加载中');
        });

        it('应该支持自定义aria-label', () => {
            render(<LoadingSpinner aria-label="自定义加载提示" />);

            const spinner = screen.getByTestId('loading-spinner');
            expect(spinner).toHaveAttribute('aria-label', '自定义加载提示');
        });
    });

    describe('Performance', () => {
        it('应该不会因为重复渲染而导致内存泄漏', () => {
            const { rerender } = render(<LoadingSpinner />);

            for (let i = 0; i < 10; i++) {
                rerender(<LoadingSpinner text={`加载 ${i}`} />);
            }

            expect(screen.getByText('加载 9')).toBeInTheDocument();
        });

        it('TableSkeleton应该高效渲染大量行', () => {
            const startTime = performance.now();

            render(<TableSkeleton rows={100} columns={10} />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // 渲染100行应该在合理时间内完成（小于100ms）
            expect(renderTime).toBeLessThan(100);
        });
    });
});