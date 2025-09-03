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

// 音声通知を再生（優しいチャイム音）
export const playNotificationSound = (volume: number = 80) => {
  try {
    // Web Audio APIを使用して優しいチャイム音を生成
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // メロディーのような優しい音階 (C-E-G のメジャーコード)
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.5; // 各音の長さ
    const fadeTime = 0.1; // フェードイン・フェードアウト時間
    
    frequencies.forEach((frequency, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 優しいサイン波を使用
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // 音量を設定（少し控えめに）
        const actualVolume = (volume / 100) * 0.6;
        
        // フェードイン・フェードアウト効果
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(actualVolume, audioContext.currentTime + fadeTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + noteDuration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + noteDuration);
      }, index * 200); // 各音を200ms間隔で再生
    });
    
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

    // 優しいバイブレーションパターンに変更
    // パターン: 振動200ms, 停止100ms, 振動200ms, 停止100ms, 振動300ms
    const result = navigator.vibrate([200, 100, 200, 100, 300]);
    
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