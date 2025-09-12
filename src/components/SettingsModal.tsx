import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaRedo } from 'react-icons/fa';
import { useAppStore } from '../store';
import { playNotificationSound } from '../utils/notifications';

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

  // バイブレーション機能を削除しました

  const handleTestSound = () => {
    playNotificationSound(formData.soundVolume);
  };

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <h2 className="text-2xl font-bold drop-shadow-lg">⚙️ 設定</h2>
          <button
            onClick={toggleSettings}
            className="p-3 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-300 backdrop-blur-sm"
          >
            <FaTimes size={22} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Timer Durations */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">⏱️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                タイマー設定
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-2xl border border-red-200">
                <label className="block text-sm font-bold text-red-800 mb-3">
                  🍅 ポモドーロ時間
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.pomodoro}
                    onChange={(e) => handleInputChange('pomodoro', parseInt(e.target.value))}
                    className="w-20 px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none font-bold text-red-700 bg-white shadow-lg transition-all duration-300"
                  />
                  <span className="text-red-700 font-medium">分</span>
                </div>
                <div className="text-xs text-red-600 mt-2 font-medium">
                  💡 推奨: 25分（標準のポモドーロテクニック）
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                <label className="block text-sm font-bold text-green-800 mb-3">
                  ☕ 短い休憩時間
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.shortBreak}
                    onChange={(e) => handleInputChange('shortBreak', parseInt(e.target.value))}
                    className="w-20 px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none font-bold text-green-700 bg-white shadow-lg transition-all duration-300"
                  />
                  <span className="text-green-700 font-medium">分</span>
                </div>
                <div className="text-xs text-green-600 mt-2 font-medium">
                  💡 推奨: 5分
                </div>
              </div>

              {/* Long Break Toggle */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-blue-800">🛋️ 長い休憩を使用する</div>
                    <div className="text-sm text-blue-600 font-medium">
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
                    <div className="w-14 h-8 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-lg"></div>
                  </label>
                </div>

                <div className={`space-y-4 ${formData.enableLongBreak ? '' : 'opacity-40'}`}>
                  <div>
                    <label className="block text-sm font-bold text-blue-800 mb-2">
                      🌊 長い休憩時間
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.longBreak}
                        onChange={(e) => handleInputChange('longBreak', parseInt(e.target.value))}
                        disabled={!formData.enableLongBreak}
                        className="w-20 px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-bold text-blue-700 bg-white shadow-lg transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
                      />
                      <span className="text-blue-700 font-medium">分</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">
                      💡 推奨: 15-30分
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-blue-800 mb-2">
                      📊 長い休憩の間隔
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={formData.longBreakInterval}
                        onChange={(e) => handleInputChange('longBreakInterval', parseInt(e.target.value))}
                        disabled={!formData.enableLongBreak}
                        className="w-20 px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-bold text-blue-700 bg-white shadow-lg transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
                      />
                      <span className="text-blue-700 font-medium">ポモドーロ毎</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">
                      💡 何回ポモドーロを完了した後に長い休憩を取るか
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-start Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                自動開始設定
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-green-800 mb-1">☕ 休憩の自動開始</div>
                    <div className="text-sm text-green-600 font-medium">
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
                    <div className="w-14 h-8 bg-green-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600 shadow-lg"></div>
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-2xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-red-800 mb-1">🍅 ポモドーロの自動開始</div>
                    <div className="text-sm text-red-600 font-medium">
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
                    <div className="w-14 h-8 bg-red-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 shadow-lg"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🔔</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                通知設定
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-2xl border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-yellow-800 mb-1">🔊 音声通知</div>
                    <div className="text-sm text-yellow-600 font-medium">
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
                    <div className="w-14 h-8 bg-yellow-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-yellow-600 shadow-lg"></div>
                  </label>
                </div>

                {formData.enableSound && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-yellow-800">
                        🎵 音量レベル
                      </label>
                      <button
                        type="button"
                        onClick={handleTestSound}
                        className="px-4 py-2 text-xs bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-800 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-md font-medium"
                      >
                        🔊 テスト
                      </button>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.soundVolume}
                        onChange={(e) => handleInputChange('soundVolume', parseInt(e.target.value))}
                        className="flex-1 h-3 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-full appearance-none cursor-pointer slider shadow-inner"
                      />
                      <span className="text-sm text-yellow-700 font-bold w-12 text-right bg-white px-2 py-1 rounded-lg">
                        {formData.soundVolume}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* バイブレーション機能を削除しました */}

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-indigo-800 mb-1">💻 ブラウザ通知</div>
                    <div className="text-sm text-indigo-600 font-medium">
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
                    <div className="w-14 h-8 bg-indigo-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-indigo-600 shadow-lg"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h4 className="font-bold text-gray-800 text-lg">設定プレビュー</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-2 bg-white p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">🍅</span>
                <span className="font-medium">ポモドーロ: {formData.pomodoro}分</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">☕</span>
                <span className="font-medium">短い休憩: {formData.shortBreak}分</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">🛋️</span>
                <span className="font-medium">
                  長い休憩: {formData.enableLongBreak 
                    ? `${formData.longBreak}分（${formData.longBreakInterval}ポモドーロ毎）` 
                    : '無効'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-500">🚀</span>
                <span className="font-medium">
                  自動開始: 
                  {formData.autoStartBreak && formData.autoStartPomodoro ? ' 完全自動' :
                   formData.autoStartBreak ? ' 休憩のみ' :
                   formData.autoStartPomodoro ? ' ポモドーロのみ' : ' 無効'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-orange-500">🔔</span>
                <span className="font-medium">
                  通知: 
                  {[
                    formData.enableSound && '音声',
                    formData.enableBrowserNotification && 'ブラウザ'
                  ].filter(Boolean).join('・') || '無効'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 pt-6">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-2xl transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🔄 リセット
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={toggleSettings}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-2xl transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                ❌ キャンセル
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl hover:from-orange-500 hover:to-orange-600 transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold"
              >
                <FaRedo className="mr-2" />
                デフォルト復元
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold"
              >
                <FaSave className="mr-2" />
                💾 保存
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;