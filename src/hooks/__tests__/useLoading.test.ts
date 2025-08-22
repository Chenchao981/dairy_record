import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageLoading, useFormLoading, useApiLoading } from '../../useLoading';

describe('useLoading Hooks', () => {
    describe('usePageLoading', () => {
        it('应该初始化页面加载状态为false', () => {
            const { result } = renderHook(() => usePageLoading('test-page'));

            expect(result.current.isPageLoading).toBe(false);
        });

        it('应该能够设置页面加载状态', () => {
            const { result } = renderHook(() => usePageLoading('test-page'));

            act(() => {
                result.current.setPageLoading(true);
            });

            expect(result.current.isPageLoading).toBe(true);

            act(() => {
                result.current.setPageLoading(false);
            });

            expect(result.current.isPageLoading).toBe(false);
        });

        it('应该为不同页面维护独立的加载状态', () => {
            const { result: result1 } = renderHook(() => usePageLoading('page-1'));
            const { result: result2 } = renderHook(() => usePageLoading('page-2'));

            act(() => {
                result1.current.setPageLoading(true);
            });

            expect(result1.current.isPageLoading).toBe(true);
            expect(result2.current.isPageLoading).toBe(false);

            act(() => {
                result2.current.setPageLoading(true);
            });

            expect(result1.current.isPageLoading).toBe(true);
            expect(result2.current.isPageLoading).toBe(true);
        });

        it('应该能够清除所有页面加载状态', () => {
            const { result: result1 } = renderHook(() => usePageLoading('page-1'));
            const { result: result2 } = renderHook(() => usePageLoading('page-2'));

            // 设置两个页面为加载状态
            act(() => {
                result1.current.setPageLoading(true);
                result2.current.setPageLoading(true);
            });

            expect(result1.current.isPageLoading).toBe(true);
            expect(result2.current.isPageLoading).toBe(true);

            // 清除所有加载状态
            act(() => {
                result1.current.clearAllLoading();
            });

            expect(result1.current.isPageLoading).toBe(false);
            expect(result2.current.isPageLoading).toBe(false);
        });

        it('应该返回页面ID', () => {
            const { result } = renderHook(() => usePageLoading('test-page-id'));

            expect(result.current.pageId).toBe('test-page-id');
        });
    });

    describe('useFormLoading', () => {
        it('应该初始化表单加载状态为false', () => {
            const { result } = renderHook(() => useFormLoading('test-form'));

            expect(result.current.isFormLoading).toBe(false);
        });

        it('应该能够设置表单加载状态', () => {
            const { result } = renderHook(() => useFormLoading('test-form'));

            act(() => {
                result.current.setFormLoading(true);
            });

            expect(result.current.isFormLoading).toBe(true);

            act(() => {
                result.current.setFormLoading(false);
            });

            expect(result.current.isFormLoading).toBe(false);
        });

        it('应该为不同表单维护独立的加载状态', () => {
            const { result: result1 } = renderHook(() => useFormLoading('form-1'));
            const { result: result2 } = renderHook(() => useFormLoading('form-2'));

            act(() => {
                result1.current.setFormLoading(true);
            });

            expect(result1.current.isFormLoading).toBe(true);
            expect(result2.current.isFormLoading).toBe(false);
        });

        it('应该能够提交表单并自动管理加载状态', async () => {
            const { result } = renderHook(() => useFormLoading('test-form'));

            const mockSubmit = vi.fn().mockResolvedValue('success');

            let submitPromise: Promise<any>;
            act(() => {
                submitPromise = result.current.submitForm(mockSubmit);
            });

            // 提交时应该设置加载状态为true
            expect(result.current.isFormLoading).toBe(true);

            // 等待提交完成
            await act(async () => {
                await submitPromise;
            });

            // 提交完成后加载状态应该为false
            expect(result.current.isFormLoading).toBe(false);
            expect(mockSubmit).toHaveBeenCalled();
        });

        it('应该在表单提交失败时仍然清除加载状态', async () => {
            const { result } = renderHook(() => useFormLoading('test-form'));

            const mockSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));

            let submitPromise: Promise<any>;
            act(() => {
                submitPromise = result.current.submitForm(mockSubmit);
            });

            expect(result.current.isFormLoading).toBe(true);

            await act(async () => {
                try {
                    await submitPromise;
                } catch (error) {
                    // 忽略错误，我们只关心加载状态
                }
            });

            expect(result.current.isFormLoading).toBe(false);
        });

        it('应该返回表单ID', () => {
            const { result } = renderHook(() => useFormLoading('test-form-id'));

            expect(result.current.formId).toBe('test-form-id');
        });
    });

    describe('useApiLoading', () => {
        it('应该初始化API加载状态为false', () => {
            const { result } = renderHook(() => useApiLoading('test-api'));

            expect(result.current.isApiLoading).toBe(false);
        });

        it('应该能够设置API加载状态', () => {
            const { result } = renderHook(() => useApiLoading('test-api'));

            act(() => {
                result.current.setApiLoading(true);
            });

            expect(result.current.isApiLoading).toBe(true);

            act(() => {
                result.current.setApiLoading(false);
            });

            expect(result.current.isApiLoading).toBe(false);
        });

        it('应该为不同API维护独立的加载状态', () => {
            const { result: result1 } = renderHook(() => useApiLoading('api-1'));
            const { result: result2 } = renderHook(() => useApiLoading('api-2'));

            act(() => {
                result1.current.setApiLoading(true);
            });

            expect(result1.current.isApiLoading).toBe(true);
            expect(result2.current.isApiLoading).toBe(false);
        });

        it('应该能够执行API调用并自动管理加载状态', async () => {
            const { result } = renderHook(() => useApiLoading('test-api'));

            const mockApiCall = vi.fn().mockResolvedValue({ data: 'success' });

            let apiPromise: Promise<any>;
            act(() => {
                apiPromise = result.current.executeApi(mockApiCall);
            });

            expect(result.current.isApiLoading).toBe(true);

            await act(async () => {
                await apiPromise;
            });

            expect(result.current.isApiLoading).toBe(false);
            expect(mockApiCall).toHaveBeenCalled();
        });

        it('应该在API调用失败时仍然清除加载状态', async () => {
            const { result } = renderHook(() => useApiLoading('test-api'));

            const mockApiCall = vi.fn().mockRejectedValue(new Error('API failed'));

            let apiPromise: Promise<any>;
            act(() => {
                apiPromise = result.current.executeApi(mockApiCall);
            });

            expect(result.current.isApiLoading).toBe(true);

            await act(async () => {
                try {
                    await apiPromise;
                } catch (error) {
                    // 忽略错误，我们只关心加载状态
                }
            });

            expect(result.current.isApiLoading).toBe(false);
        });

        it('应该返回API ID', () => {
            const { result } = renderHook(() => useApiLoading('test-api-id'));

            expect(result.current.apiId).toBe('test-api-id');
        });
    });

    describe('多个Hook集成', () => {
        it('应该能够同时使用多个loading hooks', () => {
            const { result: pageResult } = renderHook(() => usePageLoading('page'));
            const { result: formResult } = renderHook(() => useFormLoading('form'));
            const { result: apiResult } = renderHook(() => useApiLoading('api'));

            act(() => {
                pageResult.current.setPageLoading(true);
                formResult.current.setFormLoading(true);
                apiResult.current.setApiLoading(true);
            });

            expect(pageResult.current.isPageLoading).toBe(true);
            expect(formResult.current.isFormLoading).toBe(true);
            expect(apiResult.current.isApiLoading).toBe(true);
        });

        it('应该能够独立清除不同类型的加载状态', () => {
            const { result: pageResult } = renderHook(() => usePageLoading('page'));
            const { result: formResult } = renderHook(() => useFormLoading('form'));

            act(() => {
                pageResult.current.setPageLoading(true);
                formResult.current.setFormLoading(true);
            });

            act(() => {
                pageResult.current.setPageLoading(false);
            });

            expect(pageResult.current.isPageLoading).toBe(false);
            expect(formResult.current.isFormLoading).toBe(true);
        });
    });
});