// 本番環境用 - デバッグ機能は無効化

export const addMobileDebugLog = (_message: string) => {
  // 本番環境では何もしない
};

export const subscribeMobileDebugLogs = (listener: (logs: string[]) => void) => {
  // 本番環境では何もしない - 空の配列を返し、アンサブスクライブ関数を返す
  listener([]);
  return () => {};
};

export const clearMobileDebugLogs = () => {
  // 本番環境では何もしない
};