import type { TimerMode } from '../types';

// 通知許可を要求
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// ブラウザ通知を送信
export const sendBrowserNotification = (mode: TimerMode) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const messages = {
    'pomodoro': {
      title: '🍅 ポモドーロ完了！',
      body: 'お疲れ様でした！休憩時間です。'
    },
    'short-break': {
      title: '☕ 短い休憩完了！',
      body: 'リフレッシュできましたか？次のポモドーロを始めましょう！'
    },
    'long-break': {
      title: '🌟 長い休憩完了！',
      body: 'しっかり休めましたね！新しいサイクルを始めましょう！'
    }
  };
  
  const config = messages[mode];
  new Notification(config.title, {
    body: config.body,
    tag: 'pomodoro-timer'
  });
};

// 音声通知を再生
export const playNotificationSound = (volume: number = 80) => {
  try {
    // Web Audio APIを使用してビープ音を生成
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 音の設定
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
    gainNode.gain.setValueAtTime(volume / 100, audioContext.currentTime);
    
    // 3回のビープ音
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(volume / 100, audioContext.currentTime);
      oscillator2.start();
      oscillator2.stop(audioContext.currentTime + 0.1);
    }, 200);
    
    setTimeout(() => {
      const oscillator3 = audioContext.createOscillator();
      const gainNode3 = audioContext.createGain();
      oscillator3.connect(gainNode3);
      gainNode3.connect(audioContext.destination);
      oscillator3.frequency.setValueAtTime(1000, audioContext.currentTime); // 高い音
      gainNode3.gain.setValueAtTime(volume / 100, audioContext.currentTime);
      oscillator3.start();
      oscillator3.stop(audioContext.currentTime + 0.3);
    }, 400);
    
  } catch (error) {
    console.warn('音声通知を再生できませんでした:', error);
  }
};

// バイブレーション
export const triggerVibration = () => {
  try {
    // バイブレーション機能の確認
    if (!('vibrate' in navigator)) {
      console.log('このデバイスはバイブレーションに対応していません');
      return false;
    }

    // HTTPSでない場合の警告
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('バイブレーション機能にはHTTPS接続が必要です');
      return false;
    }

    // 強めのバイブレーションパターンに変更
    // パターン: 振動400ms, 停止150ms, 振動400ms, 停止150ms, 振動600ms
    const result = navigator.vibrate([400, 150, 400, 150, 600]);
    
    if (!result) {
      console.warn('バイブレーションの実行に失敗しました');
      return false;
    }
    
    console.log('バイブレーションを実行しました');
    return true;
  } catch (error) {
    console.error('バイブレーションエラー:', error);
    return false;
  }
};

// すべての通知を実行
export const triggerAllNotifications = (
  mode: TimerMode,
  settings: {
    enableSound: boolean;
    enableVibration: boolean;
    enableBrowserNotification: boolean;
    soundVolume: number;
  }
) => {
  if (settings.enableSound) {
    playNotificationSound(settings.soundVolume);
  }
  
  if (settings.enableVibration) {
    triggerVibration();
  }
  
  if (settings.enableBrowserNotification) {
    sendBrowserNotification(mode);
  }
};