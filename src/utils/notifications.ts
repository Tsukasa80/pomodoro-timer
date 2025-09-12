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

// バイブレーション機能を削除しました

// すべての通知を実行
export const triggerAllNotifications = (
  mode: TimerMode,
  settings: {
    enableSound: boolean;
    enableBrowserNotification: boolean;
    soundVolume: number;
  }
) => {
  if (settings.enableSound) {
    playNotificationSound(settings.soundVolume);
  }
  
  if (settings.enableBrowserNotification) {
    sendBrowserNotification(mode);
  }
};

// Wake Lock API - 画面消灯防止
let wakeLock: any = null;

export const requestWakeLock = async (): Promise<boolean> => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('✅ Wake Lock有効化 - 画面消灯を防止します');
      
      wakeLock.addEventListener('release', () => {
        console.log('💡 Wake Lockが解除されました');
      });
      
      return true;
    } else {
      console.log('❌ Wake Lock APIは利用できません');
      return false;
    }
  } catch (error) {
    console.error('💥 Wake Lock取得エラー:', error);
    return false;
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      console.log('💡 Wake Lockを解除しました');
    }
  } catch (error) {
    console.error('💥 Wake Lock解除エラー:', error);
  }
};

// Page Visibility API - タブの非アクティブ時対策
export const setupVisibilityChangeHandler = (onVisibilityChange: (hidden: boolean) => void) => {
  const handleVisibilityChange = () => {
    onVisibilityChange(document.hidden);
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// バックグラウンドでの時間管理
export class BackgroundTimer {
  private startTime: number = 0;
  private remainingTime: number = 0;
  private isRunning: boolean = false;
  
  start(remainingTimeMs: number): void {
    this.startTime = Date.now();
    this.remainingTime = remainingTimeMs;
    this.isRunning = true;
    console.log('⏰ バックグラウンドタイマー開始:', remainingTimeMs / 1000, '秒');
  }
  
  pause(): number {
    if (!this.isRunning) return this.remainingTime;
    
    const elapsed = Date.now() - this.startTime;
    this.remainingTime = Math.max(0, this.remainingTime - elapsed);
    this.isRunning = false;
    console.log('⏸️ バックグラウンドタイマー一時停止:', this.remainingTime / 1000, '秒残り');
    return this.remainingTime;
  }
  
  resume(): void {
    if (this.isRunning) return;
    
    this.startTime = Date.now();
    this.isRunning = true;
    console.log('▶️ バックグラウンドタイマー再開:', this.remainingTime / 1000, '秒残り');
  }
  
  getRemainingTime(): number {
    if (!this.isRunning) return this.remainingTime;
    
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.remainingTime - elapsed);
  }
  
  isComplete(): boolean {
    return this.getRemainingTime() <= 0;
  }
  
  stop(): void {
    this.isRunning = false;
    this.remainingTime = 0;
    console.log('🛑 バックグラウンドタイマー停止');
  }
}