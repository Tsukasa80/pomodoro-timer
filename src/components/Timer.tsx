import React, { useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaRedo, FaCog } from 'react-icons/fa';
import { useAppStore } from '../store';
import { formatTime, getTimerModeLabel, getTimerModeColor } from '../utils';
import { 
  requestWakeLock, 
  releaseWakeLock, 
  setupVisibilityChangeHandler, 
  BackgroundTimer,
  enableVibrationOnUserAction 
} from '../utils/notifications';

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
  } = useAppStore();
  
  const backgroundTimerRef = useRef<BackgroundTimer>(new BackgroundTimer());
  const isTabVisibleRef = useRef(true);
  const wakeLockSupportedRef = useRef(false);
  
  // デバッグログ用state (開発環境でのみ表示)
  const [debugLogs, setDebugLogs] = React.useState<string[]>([]);
  
  const addDebugLog = (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      setDebugLogs(prev => {
        const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
        return newLogs.slice(-5); // 最新5件のみ保持
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
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
      
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else {
      // Wake Lockを解除
      releaseWakeLock();
      
      // バックグラウンドタイマー一時停止
      backgroundTimerRef.current.pause();
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, tick]); // timeLeftを依存配列から除去

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
    
    // バイブレーション準備（ユーザーアクション時に有効化）
    enableVibrationOnUserAction();
    
    return () => {
      removeVisibilityHandler();
      releaseWakeLock();
      backgroundTimerRef.current.stop();
    };
  }, [settings.enableBrowserNotification, requestNotificationPermission]); // isRunning, timeLeft, tickを依存配列から除去

  const handleModeChange = (mode: typeof currentMode) => {
    setMode(mode);
  };

  const handlePlayPause = () => {
    // バイブレーションを有効化（ユーザーアクション）
    enableVibrationOnUserAction();
    
    // スマホでの自動開始を有効化（ユーザージェスチャーが必要）
    if ('ontouchstart' in window) {
      console.log('📱 スマホユーザーアクション検出 - 自動開始機能を有効化');
      // タッチデバイスでのユーザーアクションを記録
      window.sessionStorage.setItem('pomodoro-user-gesture', 'true');
    }
    
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
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ポモドーロタイマー</h1>
        <button
          onClick={toggleSettings}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="設定を開く"
        >
          <FaCog size={20} />
        </button>
      </div>

      {/* Mode Selection */}
      <div className="flex mb-8">
        {modeButtons.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg mr-2 last:mr-0 transition-colors ${
              currentMode === mode
                ? `${getTimerModeColor(mode)} text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isRunning}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div 
          className={`text-6xl font-mono font-bold mb-4 ${
            currentMode === 'pomodoro' 
              ? 'text-red-500' 
              : currentMode === 'short-break'
              ? 'text-green-500'
              : 'text-blue-500'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-lg text-gray-600 mb-2">
          {getTimerModeLabel(currentMode)}
        </div>
        {currentMode === 'pomodoro' && (
          <div className="text-sm text-gray-500">
            完了: {completedPomodoros} ポモドーロ
          </div>
        )}
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handlePlayPause}
          className={`px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-105 ${
            isRunning
              ? 'bg-orange-500 hover:bg-orange-600'
              : `${getTimerModeColor(currentMode)} hover:opacity-90`
          }`}
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
          className="px-6 py-4 rounded-full bg-gray-500 text-white font-semibold shadow-lg transition-all transform hover:scale-105 hover:bg-gray-600"
        >
          <FaRedo className="inline mr-2" />
          リセット
        </button>
      </div>

      {/* Session Completion Indicator */}
      {timeLeft === 0 && (
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
          <div className="text-green-800 font-semibold">
            🎉 セッション完了！
          </div>
          <div className="text-sm text-green-600 mt-1">
            お疲れ様でした！
          </div>
        </div>
      )}
      
      {/* Mobile Support Status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
          <div className="text-gray-600">
            📱 スマホ対応状況:
          </div>
          <div className="text-gray-500 mt-1">
            Wake Lock: {wakeLockSupportedRef.current ? '✅ 対応' : '❌ 非対応'} |
            タブ状態: {isTabVisibleRef.current ? '👁️ アクティブ' : '🙈 非アクティブ'}
          </div>
          <div className="text-gray-500 mt-1">
            自動開始: {'ontouchstart' in window ? 
              (window.sessionStorage.getItem('pomodoro-user-gesture') === 'true' ? 
                '✅ 有効' : '⏳ ユーザーアクション待ち') : 
              '✅ デスクトップ対応'} |
            デバイス: {'ontouchstart' in window ? '📱 モバイル' : '💻 デスクトップ'}
          </div>
        </div>
      )}
      
      {/* Debug Logs */}
      {process.env.NODE_ENV === 'development' && debugLogs.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-800 font-semibold text-xs mb-2">
            🐛 デバッグログ (最新5件):
          </div>
          <div className="space-y-1">
            {debugLogs.map((log, index) => (
              <div key={index} className="text-yellow-700 text-xs font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;