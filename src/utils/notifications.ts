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

// バイブレーション（ユーザージェスチャー確認付き）
export const triggerVibration = (isUserGesture = false) => {
  try {
    // デバッグ情報を出力
    console.log('🔍 バイブレーション実行開始');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Protocol:', location.protocol);
    console.log('🏠 Hostname:', location.hostname);
    
    // バイブレーション機能の確認
    if (!('vibrate' in navigator)) {
      console.log('❌ このデバイス/ブラウザはバイブレーションに対応していません');
      return false;
    }
    console.log('✅ navigator.vibrateが存在します');

    // HTTPSでない場合の警告
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ バイブレーション機能にはHTTPS接続が必要です');
      return false;
    }
    console.log('✅ プロトコルチェック通過');
    console.log('👆 ユーザージェスチャー:', isUserGesture ? 'あり' : 'なし');

    // ユーザージェスチャーチェック - 厳格に実行
    const hasUserInteracted = window.sessionStorage.getItem('pomodoro-user-gesture') === 'true';
    console.log('🔍 ユーザー操作チェック:', { 
      isUserGesture, 
      hasUserInteracted, 
      sessionValue: window.sessionStorage.getItem('pomodoro-user-gesture') 
    });
    
    if (!isUserGesture && !hasUserInteracted) {
      console.log('⚠️ ユーザージェスチャーなし - バイブレーションをスキップします');
      console.log('💡 ヒント: 画面をクリック/タップするとバイブレーションが有効になります');
      return false;
    }
    
    console.log('✅ ユーザージェスチャー確認OK - バイブレーション実行を継続');

    // Android Chromeの特別対応
    const isAndroidChrome = /Android.*Chrome/i.test(navigator.userAgent);
    const isPixel = /Pixel/i.test(navigator.userAgent);
    
    if (isAndroidChrome || isPixel) {
      console.log('📱 Android Chrome/Pixel検出 - 特別パターンを使用');
      // Android向け強めのパターン
      try {
        const result = navigator.vibrate([400, 150, 400, 150, 600]);
        console.log('🔄 Android向けパターン実行結果:', result);
        return result;
      } catch (error) {
        console.log('⚠️ Android向けバイブレーション失敗:', error);
        return false;
      }
    }

    // 通常のパターン（他のデバイス用）
    console.log('📱 通常パターンを使用');
    try {
      const result = navigator.vibrate([200, 100, 200, 100, 300]);
      
      if (!result) {
        console.warn('❌ バイブレーションの実行に失敗しました');
        return false;
      }
      
      console.log('✅ バイブレーションを実行しました');
      return true;
    } catch (error) {
      console.log('⚠️ バイブレーション実行エラー:', error);
      return false;
    }
  } catch (error) {
    console.error('💥 バイブレーションエラー:', error);
    return false;
  }
};

// バイブレーション対応状況を取得
export const getVibrationSupport = () => {
  const support = {
    hasVibrate: 'vibrate' in navigator,
    isHttps: location.protocol === 'https:' || location.hostname === 'localhost',
    isAndroid: /Android/i.test(navigator.userAgent),
    isChrome: /Chrome/i.test(navigator.userAgent),
    isPixel: /Pixel/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent),
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    userAgent: navigator.userAgent
  };
  
  console.log('📊 バイブレーション対応状況:', support);
  return support;
};

// ユーザーアクション後にバイブレーションを有効化
export const enableVibrationOnUserAction = () => {
  if ('vibrate' in navigator) {
    try {
      // 短い無音バイブレーションでAPIを活性化（ユーザージェスチャー後のみ）
      const result = navigator.vibrate(1);
      if (result) {
        console.log('✅ バイブレーションAPIを活性化しました');
        return true;
      } else {
        console.log('⚠️ バイブレーション活性化に失敗しました（ユーザージェスチャーが必要な可能性）');
        return false;
      }
    } catch (error) {
      console.log('⚠️ バイブレーション活性化エラー:', error);
      return false;
    }
  }
  return false;
};

// スマホ専用の強制バイブレーション
export const forceVibrationOnMobile = () => {
  try {
    const support = getVibrationSupport();
    console.log('📱 モバイル強制バイブレーション開始');
    
    if (!support.hasVibrate) {
      console.log('❌ Vibrate APIが存在しません');
      return false;
    }

    // 複数のパターンを試行
    const patterns = [
      [400, 150, 400, 150, 600],  // Android向け強力パターン
      [300, 100, 300, 100, 500],  // 中程度パターン
      [200, 50, 200, 50, 400],    // 軽量パターン
      [500]                       // シンプルパターン
    ];

    let success = false;
    for (const pattern of patterns) {
      console.log(`🔄 パターン試行:`, pattern);
      const result = navigator.vibrate(pattern);
      if (result) {
        console.log('✅ パターン成功:', pattern);
        success = true;
        break;
      }
      console.log('❌ パターン失敗:', pattern);
    }
    
    return success;
  } catch (error) {
    console.error('💥 強制バイブレーションエラー:', error);
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
    // セッション完了時は明示的にユーザージェスチャーなしとして呼び出し
    triggerVibration(false);
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