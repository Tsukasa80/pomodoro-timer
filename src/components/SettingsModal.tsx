import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaRedo } from 'react-icons/fa';
import { useAppStore } from '../store';
import { triggerVibration, playNotificationSound, getVibrationSupport, forceVibrationOnMobile } from '../utils/notifications';

const SettingsModal: React.FC = () => {
  const {
    settings,
    showSettings,
    updateSettings,
    toggleSettings,
    resetSettings,
  } = useAppStore();

  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings, showSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    toggleSettings();
  };

  const handleReset = () => {
    setFormData(settings);
  };

  const handleResetToDefault = () => {
    if (window.confirm('設定をデフォルト値にリセットしますか？\n（自動開始機能も含めてすべての設定がリセットされます）')) {
      resetSettings();
      setFormData(useAppStore.getState().settings);
    }
  };

  const handleInputChange = (field: keyof typeof settings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestVibration = () => {
    console.log('🧪 バイブレーションテスト開始');
    
    // ユーザーアクションを記録
    window.sessionStorage.setItem('pomodoro-user-gesture', 'true');
    console.log('👆 テスト用ユーザーアクション記録');
    
    const support = getVibrationSupport();
    
    // 通常のテスト
    const normalResult = triggerVibration(true);
    
    // スマホ向け強制テスト
    const forceResult = support.isMobile ? forceVibrationOnMobile() : false;
    
    let message = 'バイブレーションテスト結果:\n\n';
    message += `• 通常テスト: ${normalResult ? '成功' : '失敗'}\n`;
    if (support.isMobile) {
      message += `• 強制テスト: ${forceResult ? '成功' : '失敗'}\n`;
    }
    message += `• Vibrate API: ${support.hasVibrate ? '対応' : '非対応'}\n`;
    message += `• HTTPS: ${support.isHttps ? 'OK' : 'NG'}\n`;
    message += `• モバイル: ${support.isMobile ? 'Yes' : 'No'}\n`;
    message += `• Android: ${support.isAndroid ? 'Yes' : 'No'}\n`;
    message += `• iOS: ${support.isIOS ? 'Yes' : 'No'}\n`;
    message += `• Chrome: ${support.isChrome ? 'Yes' : 'No'}\n`;
    message += `• Safari: ${support.isSafari ? 'Yes' : 'No'}\n\n`;
    
    const anySuccess = normalResult || forceResult;
    
    if (!anySuccess) {
      message += '💡 解決方法:\n';
      if (support.isIOS) {
        message += '• iOSはバイブレーション未対応\n';
        message += '• 音での通知をご利用ください\n';
      } else if (!support.hasVibrate) {
        message += '• このブラウザ/デバイスは未対応\n';
      } else {
        message += '• Chrome設定: chrome://settings/content/notifications\n';
        message += '• 端末設定でバイブレーション許可を確認\n';
        message += '• 省電力モードを無効にしてください\n';
        message += '• コンソール(F12)でエラー確認\n';
      }
    } else {
      message += '✅ バイブレーションが動作しました！';
      if (forceResult && !normalResult) {
        message += '\n（強制パターンで成功）';
      }
    }
    
    alert(message);
  };

  const handleTestSound = () => {
    playNotificationSound(formData.soundVolume);
  };

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">設定</h2>
          <button
            onClick={toggleSettings}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Timer Durations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
              タイマー設定（分）
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ポモドーロ時間
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.pomodoro}
                    onChange={(e) => handleInputChange('pomodoro', parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                  <span className="text-gray-600">分</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  推奨: 25分（標準のポモドーロテクニック）
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  短い休憩時間
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.shortBreak}
                    onChange={(e) => handleInputChange('shortBreak', parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <span className="text-gray-600">分</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  推奨: 5分
                </div>
              </div>

              {/* Long Break Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-700">長い休憩を使用する</div>
                  <div className="text-sm text-gray-500">
                    無効にすると常に短い休憩が使用されます
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableLongBreak}
                    onChange={(e) => handleInputChange('enableLongBreak', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className={formData.enableLongBreak ? '' : 'opacity-50'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  長い休憩時間
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.longBreak}
                    onChange={(e) => handleInputChange('longBreak', parseInt(e.target.value))}
                    disabled={!formData.enableLongBreak}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <span className="text-gray-600">分</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  推奨: 15-30分
                </div>
              </div>

              <div className={formData.enableLongBreak ? '' : 'opacity-50'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  長い休憩の間隔
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={formData.longBreakInterval}
                    onChange={(e) => handleInputChange('longBreakInterval', parseInt(e.target.value))}
                    disabled={!formData.enableLongBreak}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <span className="text-gray-600">ポモドーロ毎</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  何回ポモドーロを完了した後に長い休憩を取るか
                </div>
              </div>
            </div>
          </div>

          {/* Auto-start Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
              自動開始設定
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">休憩の自動開始</div>
                  <div className="text-sm text-gray-500">
                    ポモドーロ完了後、自動的に休憩を開始します
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoStartBreak}
                    onChange={(e) => handleInputChange('autoStartBreak', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">ポモドーロの自動開始</div>
                  <div className="text-sm text-gray-500">
                    休憩完了後、自動的にポモドーロを開始します
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoStartPomodoro}
                    onChange={(e) => handleInputChange('autoStartPomodoro', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
              通知設定
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">音声通知</div>
                  <div className="text-sm text-gray-500">
                    タイマー完了時にビープ音で知らせます
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableSound}
                    onChange={(e) => handleInputChange('enableSound', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>

              {formData.enableSound && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      音量
                    </label>
                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
                    >
                      テスト
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.soundVolume}
                      onChange={(e) => handleInputChange('soundVolume', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {formData.soundVolume}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">バイブレーション</div>
                  <div className="text-sm text-gray-500">
                    モバイルデバイスで振動します（対応端末のみ）
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleTestVibration}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
                  >
                    テスト
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableVibration}
                      onChange={(e) => handleInputChange('enableVibration', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">ブラウザ通知</div>
                  <div className="text-sm text-gray-500">
                    デスクトップに通知を表示します
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableBrowserNotification}
                    onChange={(e) => handleInputChange('enableBrowserNotification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">設定プレビュー</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• ポモドーロ: {formData.pomodoro}分</div>
              <div>• 短い休憩: {formData.shortBreak}分</div>
              <div>
                • 長い休憩: {formData.enableLongBreak 
                  ? `${formData.longBreak}分（${formData.longBreakInterval}ポモドーロ毎）` 
                  : '無効'}
              </div>
              <div>
                • 自動開始: 
                {formData.autoStartBreak && formData.autoStartPomodoro ? ' 完全自動' :
                 formData.autoStartBreak ? ' 休憩のみ' :
                 formData.autoStartPomodoro ? ' ポモドーロのみ' : ' 無効'}
              </div>
              <div>
                • 通知: 
                {[
                  formData.enableSound && '音声',
                  formData.enableVibration && 'バイブ',
                  formData.enableBrowserNotification && 'ブラウザ'
                ].filter(Boolean).join('・') || '無効'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              リセット
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={toggleSettings}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
              >
                <FaRedo className="mr-2" />
                デフォルトにリセット
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <FaSave className="mr-2" />
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;