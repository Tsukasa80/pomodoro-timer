import React, { useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaRedo, FaCog } from 'react-icons/fa';
import { useAppStore } from '../store';
import { formatTime, getTimerModeLabel } from '../utils';
import { 
  requestWakeLock, 
  releaseWakeLock, 
  setupVisibilityChangeHandler, 
  BackgroundTimer
} from '../utils/notifications';
import { addMobileDebugLog, subscribeMobileDebugLogs, clearMobileDebugLogs } from '../utils/mobileDebug';

const Timer: React.FC = () => {
  const {
    currentMode,
    timeLeft,
    isRunning,
    completedPomodoros,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    setTimeLeft,
    setMode,
    toggleSettings,
    requestNotificationPermission,
    debugInfo,
    clearDebugInfo,
  } = useAppStore();
  
  const backgroundTimerRef = useRef<BackgroundTimer>(new BackgroundTimer());
  const isTabVisibleRef = useRef(true);
  const wakeLockSupportedRef = useRef(false);
  
  // デバッグログ用state
  const [debugLogs, setDebugLogs] = React.useState<string[]>([]);
  const [mobileDebugLogs, setMobileDebugLogs] = React.useState<string[]>([]);
  const [showMobileDebug, setShowMobileDebug] = React.useState(false);
  
  const addDebugLog = (message: string) => {
    // 従来のデバッグログ (開発環境のみ)
    if (process.env.NODE_ENV === 'development') {
      setDebugLogs(prev => {
        const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
        return newLogs.slice(-5); // 最新5件のみ保持
      });
    }
    
    // モバイル用デバッグログ (本番環境でも表示)
    addMobileDebugLog(message);
  };

  // interval管理用のref
  const intervalRef = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    // 既存のintervalをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    
    if (isRunning) {
      // Wake Lockを要求（スマホ対応）
      requestWakeLock().then(success => {
        wakeLockSupportedRef.current = success;
        if (success) {
          console.log('🔒 Wake Lock有効 - 画面消灯を防止');
        }
      });
      
      // バックグラウンドタイマー開始
      backgroundTimerRef.current.start(timeLeft * 1000);
      
      // tick関数を直接呼び出し（依存関係を避ける）
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      // Wake Lockを解除
      releaseWakeLock();
      
      // バックグラウンドタイマー一時停止
      backgroundTimerRef.current.pause();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [isRunning]); // tickを依存配列から完全に除去

  // Component initialization
  useEffect(() => {
    // Request notification permission
    if (settings.enableBrowserNotification) {
      requestNotificationPermission();
    }
    
    // Page Visibility API - タブ非アクティブ時の対策
    const removeVisibilityHandler = setupVisibilityChangeHandler((hidden) => {
      isTabVisibleRef.current = !hidden;
      
      if (hidden && isRunning) {
        console.log('📱 タブが非アクティブ - バックグラウンドタイマー継続');
        addDebugLog('📱 バックグラウンド開始');
        // バックグラウンドタイマーで継続管理
        backgroundTimerRef.current.start(timeLeft * 1000);
      } else if (!hidden && isRunning) {
        console.log('📱 タブがアクティブに復帰');
        addDebugLog('📱 フォアグラウンド復帰');
        
        // バックグラウンドタイマーから正確な残り時間を取得
        const actualTimeLeft = Math.max(0, Math.ceil(backgroundTimerRef.current.getRemainingTime() / 1000));
        
        console.log(`🔍 現在時間: ${timeLeft}秒, 実際時間: ${actualTimeLeft}秒`);
        
        if (actualTimeLeft !== timeLeft) {
          console.log(`⏰ 時間補正: ${timeLeft}秒 → ${actualTimeLeft}秒`);
          addDebugLog(`⏰ 時間補正: ${timeLeft}→${actualTimeLeft}秒`);
          setTimeLeft(actualTimeLeft); // ストアの時間を正確な値に更新
        }
        
        // バックグラウンドタイマーが完了していて、まだセッションが継続中の場合
        if (backgroundTimerRef.current.isComplete() && actualTimeLeft === 0 && isRunning) {
          console.log('🎯 バックグラウンドでセッション完了を検出 - completeSession実行');
          addDebugLog('🎯 セッション完了検出');
          setTimeLeft(0); // 確実に0に設定してcompleteSessionをトリガー
        }
      }
    });
    
    // バイブレーション機能を削除しました
    
    // モバイル用デバッグログの購読
    const unsubscribeMobileDebugLogs = subscribeMobileDebugLogs((logs) => {
      setMobileDebugLogs(logs);
    });
    
    return () => {
      removeVisibilityHandler();
      releaseWakeLock();
      backgroundTimerRef.current.stop();
      unsubscribeMobileDebugLogs();
    };
  }, [settings.enableBrowserNotification, requestNotificationPermission]); // isRunning, timeLeft, tickを依存配列から除去

  const handleModeChange = (mode: typeof currentMode) => {
    setMode(mode);
  };

  const handlePlayPause = () => {
    // ユーザーアクションを記録
    window.sessionStorage.setItem('pomodoro-user-gesture', 'true');
    console.log('👆 ユーザーアクション記録 - 自動開始機能を完全有効化', {
      isMobile: 'ontouchstart' in window,
      currentCompletedPomodoros: completedPomodoros,
      isRunning,
      currentMode
    });
    
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const modeButtons = [
    { mode: 'pomodoro' as const, label: 'ポモドーロ' },
    { mode: 'short-break' as const, label: '短い休憩' },
    ...(settings.enableLongBreak ? [{ mode: 'long-break' as const, label: '長い休憩' }] : []),
  ];

  return (
    <div className="relative">
      {/* Background Gradient Card */}
      <div className={`relative bg-gradient-to-br ${
        currentMode === 'pomodoro' 
          ? 'from-red-400 via-red-500 to-red-600' 
          : currentMode === 'short-break'
          ? 'from-green-400 via-green-500 to-green-600'
          : 'from-blue-400 via-blue-500 to-blue-600'
      } rounded-3xl p-8 max-w-md mx-auto shadow-2xl transform transition-all duration-500`}>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white bg-opacity-10 rounded-full blur-lg"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">ポモドーロタイマー</h1>
          <button
            onClick={toggleSettings}
            className="p-3 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-300 backdrop-blur-sm"
            aria-label="設定を開く"
          >
            <FaCog size={22} />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="flex mb-10 space-x-2 relative z-10">
          {modeButtons.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                currentMode === mode
                  ? 'bg-white text-gray-800 shadow-lg transform scale-105'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
              }`}
              disabled={isRunning}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-10 relative z-10">
          <div className="relative">
            {/* Timer Circle Background */}
            <div className="w-64 h-64 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full backdrop-blur-sm"></div>
              <div className="absolute inset-4 bg-white bg-opacity-10 rounded-full backdrop-blur-sm"></div>
              <div className="absolute inset-8 bg-gradient-to-br from-white to-transparent opacity-30 rounded-full"></div>
              
              {/* Timer Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-white drop-shadow-2xl mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-lg text-white text-opacity-90 font-medium">
                    {getTimerModeLabel(currentMode)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {currentMode === 'pomodoro' && (
            <div className="text-white text-opacity-80 font-medium">
              🍅 完了: {completedPomodoros} ポモドーロ
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-4 relative z-10">
          <button
            onClick={handlePlayPause}
            className={`px-8 py-4 rounded-2xl text-gray-800 font-bold text-lg shadow-xl transition-all duration-300 transform hover:scale-110 ${
              isRunning
                ? 'bg-gradient-to-r from-yellow-300 to-orange-300 hover:from-yellow-400 hover:to-orange-400'
                : 'bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-white'
            } hover:shadow-2xl`}
          >
            {isRunning ? (
              <>
                <FaPause className="inline mr-2" />
                一時停止
              </>
            ) : (
              <>
                <FaPlay className="inline mr-2" />
                開始
              </>
            )}
          </button>
          
          <button
            onClick={resetTimer}
            className="px-6 py-4 rounded-2xl bg-white bg-opacity-20 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-110 hover:bg-opacity-30 backdrop-blur-sm hover:shadow-2xl"
          >
            <FaRedo className="inline mr-2" />
            リセット
          </button>
        </div>
      </div>

      {/* 自動開始中のインジケーター - 自動開始が有効な場合 */}
      {timeLeft === 0 && !isRunning && (
        (currentMode === 'pomodoro' && settings.autoStartBreak) ||
        ((currentMode === 'short-break' || currentMode === 'long-break') && settings.autoStartPomodoro)
      ) && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-400 to-blue-500 border border-blue-300 rounded-2xl text-center shadow-2xl">
          <div className="text-white font-bold text-xl drop-shadow-lg">
            ⏳ 次のセッションを準備中...
          </div>
          <div className="text-sm text-blue-100 mt-2 font-medium">
            自動開始まで少々お待ちください 🚀
          </div>
        </div>
      )}
      
      {/* Session Completion Indicator - 自動開始が無効の場合のみ表示 */}
      {timeLeft === 0 && !isRunning && (
        (currentMode === 'pomodoro' && !settings.autoStartBreak) ||
        ((currentMode === 'short-break' || currentMode === 'long-break') && !settings.autoStartPomodoro)
      ) && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-400 to-green-500 border border-green-300 rounded-2xl text-center shadow-2xl transform animate-pulse">
          <div className="text-white font-bold text-xl drop-shadow-lg">
            🎉 セッション完了！
          </div>
          <div className="text-sm text-green-100 mt-2 font-medium">
            お疲れ様でした！次のセッションを開始してください✨
          </div>
        </div>
      )}
      
      {/* Mobile Support Status - 常に表示（スマホのみ）*/}
      {'ontouchstart' in window && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-xs shadow-lg">
          <div className="text-blue-800 font-semibold mb-2">
            📱 モバイル自動開始状況:
          </div>
          <div className="text-blue-700 space-y-2 bg-white p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className={window.sessionStorage.getItem('pomodoro-user-gesture') === 'true' ? 'text-green-600' : 'text-orange-600'}>
                {window.sessionStorage.getItem('pomodoro-user-gesture') === 'true' ? '✅' : '⏳'}
              </span>
              <span className="font-medium">
                自動開始: {window.sessionStorage.getItem('pomodoro-user-gesture') === 'true' ? '有効' : 'ユーザーアクション待ち'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={wakeLockSupportedRef.current ? 'text-green-600' : 'text-red-600'}>
                {wakeLockSupportedRef.current ? '✅' : '❌'}
              </span>
              <span className="font-medium">Wake Lock: {wakeLockSupportedRef.current ? '対応' : '非対応'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={isTabVisibleRef.current ? 'text-green-600' : 'text-orange-600'}>
                {isTabVisibleRef.current ? '👁️' : '🙈'}
              </span>
              <span className="font-medium">タブ状態: {isTabVisibleRef.current ? 'アクティブ' : '非アクティブ'}</span>
            </div>
            <div className="text-blue-600 font-medium text-center mt-2">
              自動開始が動作しない場合は、画面をタップしてください
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Support Status - 開発環境のみ */}
      {process.env.NODE_ENV === 'development' && !('ontouchstart' in window) && (
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-2xl text-xs shadow-lg">
          <div className="text-gray-700 font-semibold mb-2">
            💻 デスクトップ対応状況:
          </div>
          <div className="text-gray-600 space-y-1">
            <div>Wake Lock: {wakeLockSupportedRef.current ? '✅ 対応' : '❌ 非対応'} | タブ状態: {isTabVisibleRef.current ? '👁️ アクティブ' : '🙈 非アクティブ'}</div>
            <div>自動開始: ✅ デスクトップ対応</div>
          </div>
        </div>
      )}
      
      {/* Debug Logs (開発環境) */}
      {process.env.NODE_ENV === 'development' && debugLogs.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-lg">
          <div className="text-yellow-800 font-semibold text-xs mb-3">
            🐛 デバッグログ (最新5件):
          </div>
          <div className="space-y-1">
            {debugLogs.map((log, index) => (
              <div key={index} className="text-yellow-700 text-xs font-mono bg-white bg-opacity-60 p-2 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mobile Debug Logs (本番環境でも表示) */}
      {'ontouchstart' in window && mobileDebugLogs.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-blue-800 font-semibold text-sm">
              📱 デバッグ情報 (最新10件):
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowMobileDebug(!showMobileDebug)}
                className="text-xs px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-blue-300 transition-all duration-300 shadow-md"
              >
                {showMobileDebug ? '非表示' : '表示'}
              </button>
              <button
                onClick={clearMobileDebugLogs}
                className="text-xs px-3 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-xl hover:from-red-200 hover:to-red-300 transition-all duration-300 shadow-md"
              >
                クリア
              </button>
            </div>
          </div>
          {showMobileDebug && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl max-h-40 overflow-y-auto shadow-lg">
              <div className="space-y-2">
                {mobileDebugLogs.map((log, index) => (
                  <div key={index} className="text-blue-800 text-xs font-mono break-words bg-white bg-opacity-60 p-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Store Debug Info - スマホでも表示 */}
      <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-yellow-800 font-semibold text-sm">
            🔍 リアルタイムデバッグ情報:
          </div>
          <button
            onClick={clearDebugInfo}
            className="text-xs px-3 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-xl hover:from-red-200 hover:to-red-300 transition-all duration-300 shadow-md"
          >
            クリア
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <div className="text-yellow-700 text-sm bg-white bg-opacity-60 p-3 rounded-xl">
              デバッグ情報はまだありません。タイマーを開始してください。
            </div>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="text-yellow-800 text-sm font-mono bg-white bg-opacity-60 p-2 rounded-xl">
                {info}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;