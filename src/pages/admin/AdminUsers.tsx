import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Calendar,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Save,
  X
} from 'lucide-react';
import { adminApi } from '../../stores/adminStore';
import { toast } from 'sonner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { usePageLoading } from '../../hooks/useLoading';
import { LoadingSpinner, PageLoading, TableSkeleton } from '../../components/Loading';

interface User {
  id: number;
  username: string;
  email: string;
  account?: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  status: 'active' | 'inactive' | 'banned';
  is_active: boolean;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AdminUsers: React.FC = () => {
  const { handleError, handleNetworkError, handleFormError } = useErrorHandler();
  const { isPageLoading, setPageLoading } = usePageLoading('admin-users');

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    account: '',
    phone: '',
    role: 'user',
    status: 'active' as 'active' | 'inactive' | 'banned'
  });
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen !== null) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  const fetchUsers = async () => {
    try {
      setPageLoading(true);
      setError(null);

      const response = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err: any) {
      const errorMessage = err.message || '获取用户列表失败';
      setError(errorMessage);
      handleNetworkError(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      account: user.account || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
    setDropdownOpen(null);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const response = await adminApi.updateUser(editingUser.id, editForm);
      
      if (response.success) {
        toast.success('用户信息更新成功');
        setShowEditModal(false);
        fetchUsers(); // 重新加载用户列表
      } else {
        throw new Error(response.message || '更新失败');
      }
    } catch (error: any) {
      handleFormError(error, {
        username: '用户名格式不正确',
        email: '邮箱格式不正确或已被使用',
      });
      console.error('Update user failed:', error);
    }
  };

  const handleToggleUserStatus = async (user: User, newStatus: 'active' | 'banned') => {
    try {
      const response = await adminApi.updateUserStatus(user.id, newStatus);
      
      if (response.success) {
        const statusText = newStatus === 'active' ? '启用' : '禁用';
        toast.success(`用户${statusText}成功`);
        setDropdownOpen(null);
        fetchUsers(); // 重新加载用户列表
      } else {
        throw new Error(response.message || '状态更新失败');
      }
    } catch (error: any) {
      const statusText = newStatus === 'active' ? '启用' : '禁用';
      handleNetworkError(error);
      console.error('Toggle user status failed:', error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await adminApi.deleteUser(user.id);
      
      if (response.success) {
        toast.success('用户删除成功');
        setDropdownOpen(null);
        fetchUsers(); // 重新加载用户列表
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (error: any) {
      handleNetworkError(error);
      console.error('Delete user failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, isActive?: boolean) => {
    if (status === 'banned' || isActive === false) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Ban className="w-3 h-3 mr-1" />
          已禁用
        </span>
      );
    } else if (status === 'active' || isActive === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          正常
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <User className="w-3 h-3 mr-1" />
          未知
        </span>
      );
    }
  };

  if (isPageLoading && users.length === 0) {
    return <PageLoading text="加载用户列表中..." />;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理系统用户和权限</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            共 {pagination.total} 个用户
          </span>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                aria-label="搜索用户"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-sm sm:text-base"
                aria-label="选择用户状态"
              >
                <option value="all">所有状态</option>
                <option value="active">活跃用户</option>
                <option value="inactive">非活跃用户</option>
                <option value="banned">已禁用</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              title="搜索"
              aria-label="搜索"
            >
              搜索
            </button>
          </div>
        </form>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">
              <strong>错误:</strong> {error}
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* 用户列表 */}
      {isPageLoading && users.length > 0 ? (
        <TableSkeleton rows={pagination.limit} columns={6} />
      ) : (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 桌面端表格视图 */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后登录
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.last_login ? formatDate(user.last_login) : '从未登录'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status, user.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2 relative">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="查看详情"
                          aria-label="查看用户详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            title="更多操作"
                            aria-label="更多操作"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {dropdownOpen === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  编辑用户
                                </button>

                                {user.status === 'banned' || !user.is_active ? (
                                  <button
                                    onClick={() => handleToggleUserStatus(user, 'active')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    启用用户
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleUserStatus(user, 'banned')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    禁用用户
                                  </button>
                                )}

                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  删除用户
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片视图 */}
          <div className="lg:hidden space-y-3 p-4">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(user.status, user.is_active)}
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        title="更多操作"
                        aria-label="更多操作"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {dropdownOpen === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              查看详情
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              编辑用户
                            </button>

                            {user.status === 'banned' || !user.is_active ? (
                              <button
                                onClick={() => handleToggleUserStatus(user, 'active')}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                启用用户
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleUserStatus(user, 'banned')}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                禁用用户
                              </button>
                            )}

                            <div className="border-t border-gray-100"></div>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除用户
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span>注册: {formatDate(user.created_at)}</span>
                  </div>
                  {user.last_login && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span>最后登录: {formatDate(user.last_login)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    条，共 <span className="font-medium">{pagination.total}</span> 条记录
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="上一页"
                      title="上一页"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === pagination.page
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="下一页"
                      title="下一页"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 用户详情模态框 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">用户详情</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="关闭对话框"
                  aria-label="关闭"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUser.username}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">用户ID:</span>
                    <span className="text-gray-900">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">注册时间:</span>
                    <span className="text-gray-900">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">最后登录:</span>
                    <span className="text-gray-900">
                      {selectedUser.last_login ? formatDate(selectedUser.last_login) : '从未登录'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">状态:</span>
                    {getStatusBadge(selectedUser.status, selectedUser.is_active)}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      handleEditUser(selectedUser);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    编辑用户
                  </button>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 用户编辑模态框 */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">编辑用户</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
              <div>
                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">
                  用户名
                </label>
                <input
                  id="edit-username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-account" className="block text-sm font-medium text-gray-700 mb-1">
                  账号
                </label>
                <input
                  id="edit-account"
                  type="text"
                  value={editForm.account}
                  onChange={(e) => setEditForm(prev => ({ ...prev, account: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  手机号
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  角色
                </label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                  <option value="super_admin">超级管理员</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="active">正常</option>
                  <option value="inactive">非活跃</option>
                  <option value="banned">已禁用</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;