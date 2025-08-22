import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

describe('State Management Tests', () => {
    describe('Zustand Store Basics', () => {
        interface TestState {
            count: number;
            user: { name: string; id: number } | null;
            loading: boolean;
            increment: () => void;
            decrement: () => void;
            setUser: (user: { name: string; id: number }) => void;
            setLoading: (loading: boolean) => void;
            reset: () => void;
        }

        const createTestStore = () => create<TestState>()((set) => ({
            count: 0,
            user: null,
            loading: false,
            increment: () => set((state) => ({ count: state.count + 1 })),
            decrement: () => set((state) => ({ count: state.count - 1 })),
            setUser: (user) => set({ user }),
            setLoading: (loading) => set({ loading }),
            reset: () => set({ count: 0, user: null, loading: false }),
        }));

        it('应该能够创建基础store', () => {
            const useTestStore = createTestStore();
            const store = useTestStore.getState();

            expect(store.count).toBe(0);
            expect(store.user).toBe(null);
            expect(store.loading).toBe(false);
        });

        it('应该能够更新计数器状态', () => {
            const useTestStore = createTestStore();

            // 获取初始状态
            expect(useTestStore.getState().count).toBe(0);

            // 增加计数
            useTestStore.getState().increment();
            expect(useTestStore.getState().count).toBe(1);

            // 再次增加
            useTestStore.getState().increment();
            expect(useTestStore.getState().count).toBe(2);

            // 减少计数
            useTestStore.getState().decrement();
            expect(useTestStore.getState().count).toBe(1);
        });

        it('应该能够管理用户状态', () => {
            const useTestStore = createTestStore();
            const testUser = { name: 'Test User', id: 1 };

            // 初始状态
            expect(useTestStore.getState().user).toBe(null);

            // 设置用户
            useTestStore.getState().setUser(testUser);
            expect(useTestStore.getState().user).toEqual(testUser);
        });

        it('应该能够管理加载状态', () => {
            const useTestStore = createTestStore();

            // 初始状态
            expect(useTestStore.getState().loading).toBe(false);

            // 设置加载中
            useTestStore.getState().setLoading(true);
            expect(useTestStore.getState().loading).toBe(true);

            // 取消加载
            useTestStore.getState().setLoading(false);
            expect(useTestStore.getState().loading).toBe(false);
        });

        it('应该能够重置状态', () => {
            const useTestStore = createTestStore();

            // 修改所有状态
            useTestStore.getState().increment();
            useTestStore.getState().setUser({ name: 'Test', id: 1 });
            useTestStore.getState().setLoading(true);

            // 验证状态已改变
            expect(useTestStore.getState().count).toBe(1);
            expect(useTestStore.getState().user).toEqual({ name: 'Test', id: 1 });
            expect(useTestStore.getState().loading).toBe(true);

            // 重置状态
            useTestStore.getState().reset();

            // 验证状态已重置
            expect(useTestStore.getState().count).toBe(0);
            expect(useTestStore.getState().user).toBe(null);
            expect(useTestStore.getState().loading).toBe(false);
        });
    });

    describe('Async State Management', () => {
        interface AsyncState {
            data: any[];
            loading: boolean;
            error: string | null;
            fetchData: () => Promise<void>;
            addItem: (item: any) => Promise<void>;
            clearError: () => void;
        }

        const createAsyncStore = () => create<AsyncState>()((set, get) => ({
            data: [],
            loading: false,
            error: null,

            fetchData: async () => {
                set({ loading: true, error: null });

                try {
                    // 模拟API调用
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const mockData = [
                        { id: 1, name: 'Item 1' },
                        { id: 2, name: 'Item 2' },
                    ];

                    set({ data: mockData, loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        loading: false
                    });
                }
            },

            addItem: async (item: any) => {
                set({ loading: true, error: null });

                try {
                    // 模拟API调用
                    await new Promise(resolve => setTimeout(resolve, 50));

                    const currentData = get().data;
                    set({ data: [...currentData, item], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to add item',
                        loading: false
                    });
                }
            },

            clearError: () => set({ error: null }),
        }));

        it('应该能够处理异步数据获取', async () => {
            const useAsyncStore = createAsyncStore();

            // 初始状态
            expect(useAsyncStore.getState().data).toEqual([]);
            expect(useAsyncStore.getState().loading).toBe(false);
            expect(useAsyncStore.getState().error).toBe(null);

            // 开始获取数据
            const fetchPromise = useAsyncStore.getState().fetchData();

            // 应该设置loading状态
            expect(useAsyncStore.getState().loading).toBe(true);

            // 等待完成
            await fetchPromise;

            // 验证结果
            expect(useAsyncStore.getState().loading).toBe(false);
            expect(useAsyncStore.getState().data).toEqual([
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
            ]);
            expect(useAsyncStore.getState().error).toBe(null);
        });

        it('应该能够添加新项目', async () => {
            const useAsyncStore = createAsyncStore();

            // 先获取初始数据
            await useAsyncStore.getState().fetchData();

            const initialCount = useAsyncStore.getState().data.length;
            const newItem = { id: 3, name: 'New Item' };

            // 添加新项目
            await useAsyncStore.getState().addItem(newItem);

            // 验证结果
            expect(useAsyncStore.getState().data).toHaveLength(initialCount + 1);
            expect(useAsyncStore.getState().data).toContainEqual(newItem);
            expect(useAsyncStore.getState().loading).toBe(false);
        });

        it('应该能够清除错误', () => {
            const useAsyncStore = createAsyncStore();

            // 手动设置错误状态来测试
            useAsyncStore.setState({ error: 'Test error' });
            expect(useAsyncStore.getState().error).toBe('Test error');

            // 清除错误
            useAsyncStore.getState().clearError();
            expect(useAsyncStore.getState().error).toBe(null);
        });
    });

    describe('Store Subscriptions', () => {
        it('应该能够订阅状态变化', () => {
            const useTestStore = create<{ count: number; increment: () => void }>()((set) => ({
                count: 0,
                increment: () => set((state) => ({ count: state.count + 1 })),
            }));

            const mockCallback = vi.fn();

            // 订阅状态变化
            const unsubscribe = useTestStore.subscribe(mockCallback);

            // 触发状态变化
            useTestStore.getState().increment();

            // 验证回调被调用
            expect(mockCallback).toHaveBeenCalledTimes(1);

            // 再次触发
            useTestStore.getState().increment();
            expect(mockCallback).toHaveBeenCalledTimes(2);

            // 取消订阅
            unsubscribe();

            // 再次触发，回调不应该被调用
            useTestStore.getState().increment();
            expect(mockCallback).toHaveBeenCalledTimes(2);
        });

        it('应该能够选择性订阅状态变化', () => {
            const useTestStore = create<{
                count: number;
                name: string;
                increment: () => void;
                setName: (name: string) => void;
            }>()((set) => ({
                count: 0,
                name: 'test',
                increment: () => set((state) => ({ count: state.count + 1 })),
                setName: (name: string) => set({ name }),
            }));

            const countCallback = vi.fn();

            // 只订阅count变化
            const unsubscribe = useTestStore.subscribe(
                (state) => state.count,
                countCallback
            );

            // 改变name，不应该触发回调
            useTestStore.getState().setName('new name');
            expect(countCallback).toHaveBeenCalledTimes(0);

            // 改变count，应该触发回调
            useTestStore.getState().increment();
            expect(countCallback).toHaveBeenCalledTimes(1);

            unsubscribe();
        });
    });

    describe('Store Middleware Simulation', () => {
        it('应该能够模拟持久化中间件', () => {
            // 模拟localStorage
            const storage = new Map<string, string>();
            const mockLocalStorage = {
                getItem: (key: string) => storage.get(key) || null,
                setItem: (key: string, value: string) => storage.set(key, value),
                removeItem: (key: string) => storage.delete(key),
            };

            // 创建带持久化的store
            const createPersistedStore = (key: string) => {
                const store = create<{ count: number; increment: () => void }>()((set) => ({
                    count: 0,
                    increment: () => set((state) => ({ count: state.count + 1 })),
                }));

                // 从localStorage加载初始状态
                const savedState = mockLocalStorage.getItem(key);
                if (savedState) {
                    try {
                        const parsedState = JSON.parse(savedState);
                        store.setState(parsedState);
                    } catch (error) {
                        console.warn('Failed to parse saved state');
                    }
                }

                // 订阅状态变化并保存到localStorage
                store.subscribe((state) => {
                    mockLocalStorage.setItem(key, JSON.stringify(state));
                });

                return store;
            };

            const store = createPersistedStore('test-store');

            // 初始状态
            expect(store.getState().count).toBe(0);

            // 修改状态
            store.getState().increment();
            expect(store.getState().count).toBe(1);

            // 验证状态已保存到localStorage
            const saved = mockLocalStorage.getItem('test-store');
            expect(JSON.parse(saved!)).toEqual({ count: 1 });

            // 创建新store实例，应该加载保存的状态
            const newStore = createPersistedStore('test-store');
            expect(newStore.getState().count).toBe(1);
        });
    });
});