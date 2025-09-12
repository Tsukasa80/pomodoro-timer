// スマホ用のデバッグログ表示機能

let debugLogs: string[] = [];
let debugLogListeners: Array<(logs: string[]) => void> = [];

export const addMobileDebugLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `${timestamp}: ${message}`;
  
  // コンソールにも出力
  console.log('📱 ' + logMessage);
  
  // モバイル用ログに追加
  debugLogs = [...debugLogs, logMessage].slice(-10); // 最新10件のみ保持
  
  // リスナーに通知
  debugLogListeners.forEach(listener => listener([...debugLogs]));
};

export const subscribeMobileDebugLogs = (listener: (logs: string[]) => void) => {
  debugLogListeners.push(listener);
  // 初期値を送信
  listener([...debugLogs]);
  
  // アンサブスクライブ関数を返す
  return () => {
    debugLogListeners = debugLogListeners.filter(l => l !== listener);
  };
};

export const clearMobileDebugLogs = () => {
  debugLogs = [];
  debugLogListeners.forEach(listener => listener([]));
};