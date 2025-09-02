import React, { useEffect } from 'react';
import { FaPlay, FaPause, FaRedo, FaCog } from 'react-icons/fa';
import { useAppStore } from '../store';
import { formatTime, getTimerModeLabel, getTimerModeColor } from '../utils';

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
    setMode,
    toggleSettings,
  } = useAppStore();

  useEffect(() => {
    let interval: number;
    
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, tick]);

  const handleModeChange = (mode: typeof currentMode) => {
    setMode(mode);
  };

  const handlePlayPause = () => {
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
    </div>
  );
};

export default Timer;