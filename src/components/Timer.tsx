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
    migrationInfo,
    clearMigrationInfo,
  } = useAppStore();
  
  const backgroundTimerRef = useRef<BackgroundTimer>(new BackgroundTimer());
  const isTabVisibleRef = useRef(true);
  const wakeLockSupportedRef = useRef(false);

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
          console.log('Wake Lock有効 - 画面消灯を防止');
        }
      });
      
      // バックグラウンドタイマー開始
      backgroundTimerRef.current.start(timeLeft * 1000);
      
      // tick関数を直接呼び出し（依存関係を避ける + 強制停止チェック）
      intervalRef.current = setInterval(() => {
        // ストアの最新状態を直接確認して強制停止
        const currentStore = useAppStore.getState();
        if (!currentStore.isRunning || currentStore.timeLeft <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
          return;
        }
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
        // バックグラウンドタイマーで継続管理
        backgroundTimerRef.current.start(timeLeft * 1000);
      } else if (!hidden && isRunning) {
        console.log('📱 タブがアクティブに復帰');
        
        // バックグラウンドタイマーから正確な残り時間を取得
        const actualTimeLeft = Math.max(0, Math.ceil(backgroundTimerRef.current.getRemainingTime() / 1000));
        
        console.log(`🔍 現在時間: ${timeLeft}秒, 実際時間: ${actualTimeLeft}秒`);
        
        if (actualTimeLeft !== timeLeft) {
          console.log(`⏰ 時間補正: ${timeLeft}秒 → ${actualTimeLeft}秒`);
          setTimeLeft(actualTimeLeft); // ストアの時間を正確な値に更新
        }
        
        // バックグラウンドタイマーが完了していて、まだセッションが継続中の場合
        if (backgroundTimerRef.current.isComplete() && actualTimeLeft === 0 && isRunning) {
          console.log('🎯 バックグラウンドでセッション完了を検出 - completeSession実行');
          setTimeLeft(0); // 確実に0に設定してcompleteSessionをトリガー
        }
      }
    });
    
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
      {/* Migration Info Notification */}
      {migrationInfo && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-blue-800 font-bold text-sm mb-2">
                📦 データ更新通知
              </div>
              <div className="text-blue-700 text-sm leading-relaxed">
                {migrationInfo}
              </div>
            </div>
            <button
              onClick={clearMigrationInfo}
              className="ml-3 text-blue-600 hover:text-blue-800 font-bold text-lg"
              aria-label="通知を閉じる"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
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
    </div>
  );
};

export default Timer;