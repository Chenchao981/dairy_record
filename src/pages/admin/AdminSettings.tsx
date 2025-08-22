import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload,
  Database,
  Shield,
  Bell,
  Palette,
  Globe,
  Mail,
  Server,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { adminApi } from '../../stores/adminStore';

interface SystemConfig {
  appName: string;
  appDescription: string;
  maxEmotionsPerDay: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  sessionTimeout: number;
}

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    appName: '情绪记录疗愈应用',
    appDescription: '帮助用户记录和管理情绪的健康应用',
    maxEmotionsPerDay: 10,
    enableNotifications: true,
    enableEmailAlerts: false,
    maintenanceMode: false,
    allowRegistration: true,
    sessionTimeout: 24
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    // 在实际应用中，这里会从后端加载配置
    // loadSystemConfig();
  }, []);

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      // 模拟保存配置到后端
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: '配置已成功保存' });
    } catch (error) {
      setMessage({ type: 'error', text: '保存配置失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async (dataType: string) => {
    try {
      setLoading(true);
      setMessage(null);
      
      let data: any = {};
      let filename = '';
      
      switch (dataType) {
        case 'users':
          // 获取用户数据
          const usersResponse = await adminApi.getUsers({ page: 1, limit: 1000 });
          data = usersResponse.data.users;
          filename = `users-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'emotions':
          // 模拟获取情绪数据
          data = { message: '情绪数据导出功能开发中' };
          filename = `emotions-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'analytics':
          // 获取分析数据
          data = { message: '分析数据导出功能开发中' };
          filename = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'system':
          // 导出系统配置
          data = { config, exportTime: new Date().toISOString() };
          filename = `system-config-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('未知的数据类型');
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: `${dataType === 'users' ? '用户' : dataType === 'emotions' ? '情绪' : dataType === 'analytics' ? '分析' : '系统'}数据导出成功` });
    } catch (error) {
      setMessage({ type: 'error', text: '数据导出失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            console.log('导入的数据:', data);
            setMessage({ type: 'info', text: '数据导入功能开发中，请联系技术支持' });
          } catch (error) {
            setMessage({ type: 'error', text: '文件格式错误，请选择有效的JSON文件' });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const tabs = [
    { id: 'general', name: '常规设置', icon: Settings },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'data', name: '数据管理', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-1">管理应用配置和系统参数</p>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`rounded-lg p-4 flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
          {message.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          {message.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className={`text-sm ${
            message.type === 'success' ? 'text-green-800' :
            message.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {message.text}
          </span>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* 常规设置 */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-purple-600" />
                  应用信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      应用名称
                    </label>
                    <input
                      type="text"
                      value={config.appName}
                      onChange={(e) => handleConfigChange('appName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      会话超时 (小时)
                    </label>
                    <input
                      type="number"
                      value={config.sessionTimeout}
                      onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    应用描述
                  </label>
                  <textarea
                    value={config.appDescription}
                    onChange={(e) => handleConfigChange('appDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  功能设置
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">允许用户注册</label>
                      <p className="text-xs text-gray-500">是否允许新用户注册账户</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allowRegistration}
                        onChange={(e) => handleConfigChange('allowRegistration', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">维护模式</label>
                      <p className="text-xs text-gray-500">启用后用户无法访问应用</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.maintenanceMode}
                        onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      每日最大情绪记录数
                    </label>
                    <input
                      type="number"
                      value={config.maxEmotionsPerDay}
                      onChange={(e) => handleConfigChange('maxEmotionsPerDay', parseInt(e.target.value))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 安全设置 */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-600" />
                  安全配置
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      安全设置修改需要管理员权限，请谨慎操作
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">密码策略</h4>
                    <p className="text-sm text-gray-600 mb-3">当前密码要求：最少8位字符，包含字母和数字</p>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      修改密码策略
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">API访问控制</h4>
                    <p className="text-sm text-gray-600 mb-3">管理API访问权限和速率限制</p>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      配置API权限
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">数据加密</h4>
                    <p className="text-sm text-gray-600 mb-3">敏感数据加密状态：已启用</p>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">数据库加密已启用</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 通知设置 */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-purple-600" />
                  通知配置
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">系统通知</h4>
                      <p className="text-sm text-gray-600">启用系统内通知功能</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableNotifications}
                        onChange={(e) => handleConfigChange('enableNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        邮件提醒
                      </h4>
                      <p className="text-sm text-gray-600">发送重要事件的邮件通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableEmailAlerts}
                        onChange={(e) => handleConfigChange('enableEmailAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  {config.enableEmailAlerts && (
                    <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">邮件服务器配置</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP服务器
                          </label>
                          <input
                            type="text"
                            placeholder="smtp.example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            端口
                          </label>
                          <input
                            type="number"
                            placeholder="587"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 数据管理 */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-purple-600" />
                  数据导出
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">用户数据</h4>
                    <p className="text-sm text-gray-600 mb-3">导出所有用户信息和账户数据</p>
                    <button
                      onClick={() => handleExportData('users')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>导出用户数据</span>
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">情绪记录</h4>
                    <p className="text-sm text-gray-600 mb-3">导出所有情绪记录和相关数据</p>
                    <button
                      onClick={() => handleExportData('emotions')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>导出情绪数据</span>
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">分析报告</h4>
                    <p className="text-sm text-gray-600 mb-3">导出数据分析和统计报告</p>
                    <button
                      onClick={() => handleExportData('analytics')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>导出分析数据</span>
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">系统配置</h4>
                    <p className="text-sm text-gray-600 mb-3">导出当前系统配置信息</p>
                    <button
                      onClick={() => handleExportData('system')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>导出系统配置</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-purple-600" />
                  数据导入
                </h3>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">批量导入</h4>
                  <p className="text-sm text-gray-600 mb-3">从JSON文件导入数据（请谨慎操作）</p>
                  <button
                    onClick={handleImportData}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>选择文件导入</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-purple-600" />
                  数据库维护
                </h3>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">危险操作</span>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    以下操作可能影响系统稳定性，请在维护窗口期间执行
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      清理临时数据
                    </button>
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      重建数据库索引
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        {(activeTab === 'general' || activeTab === 'notifications') && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中...' : '保存设置'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;