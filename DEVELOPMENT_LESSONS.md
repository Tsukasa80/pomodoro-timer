# 開発で学んだ教訓と対策集

## 📅 作成日: 2025-09-13

## 🎯 プロジェクト概要
ポモドーロタイマーアプリの開発において、ローカル環境では動作するがGitHub Pagesで動作しない問題を解決した際の教訓と対策をまとめる。

---

## 🚨 主要な問題と解決策

### 1. React useEffect + setInterval 無限ループ問題

#### 🔍 問題の詳細
```typescript
// ❌ 問題のあったコード
useEffect(() => {
  const interval = setInterval(() => {
    tick(); // この関数が毎回再作成される
  }, 1000);
  return () => clearInterval(interval);
}, [isRunning, tick]); // ← tick依存が原因
```

**根本原因:**
- `tick`関数がZustandストア更新で毎回再作成
- useEffectが`tick`変更を検知して新しいsetIntervalを作成
- 古いsetIntervalがクリアされずに残存
- 複数のsetIntervalが同時実行 → 無限ループ

#### ✅ 解決策
```typescript
// ✅ 修正後のコード
const intervalRef = useRef<NodeJS.Timeout | undefined>();

useEffect(() => {
  // 既存のintervalを確実にクリア
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
  }
  
  if (isRunning) {
    intervalRef.current = setInterval(() => {
      // ストア状態を直接確認して強制停止
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
  }
  
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };
}, [isRunning]); // tick依存を除去
```

**対策ポイント:**
1. **useRefでinterval管理**: 確実なsetInterval制御
2. **依存配列最小化**: 不要な再実行を防止
3. **状態直接確認**: `useAppStore.getState()`で最新状態取得
4. **強制停止機能**: 異常状態の自動検知と停止

---

### 2. Zustand状態管理での非同期更新問題

#### 🔍 問題の詳細
```typescript
// ❌ 問題のあった処理順序
tick: () => {
  if (newTimeLeft === 0) {
    set({ isRunning: false }); // 非同期で更新
    get().completeSession();   // 古い状態を参照
  }
}

completeSession: () => {
  // まだisRunning=trueの古い状態
  if (autoStart) {
    get().startTimer(); // isRunning=trueに戻る
  }
}
```

#### ✅ 解決策
```typescript
// ✅ 修正後のコード
tick: () => {
  if (currentState.timeLeft <= 0) {
    // 緊急停止処理
    set({ isRunning: false, timeLeft: 0 });
    
    // 重複実行防止
    const hasAlreadyCompleted = window.sessionStorage.getItem('session-completing');
    if (!hasAlreadyCompleted) {
      window.sessionStorage.setItem('session-completing', 'true');
      setTimeout(() => {
        get().completeSession();
        window.sessionStorage.removeItem('session-completing');
      }, 100);
    }
    return;
  }
}

startTimer: () => {
  const state = get();
  
  // 時間が0の場合は自動リセット
  if (state.timeLeft <= 0) {
    const duration = getCurrentModeDuration(state);
    set({ timeLeft: duration * 60 });
  }
  
  set({ isRunning: true });
}
```

**対策ポイント:**
1. **状態更新の原子性**: 関連する状態を同時更新
2. **重複実行防止**: sessionStorageフラグ活用
3. **setTimeout遅延**: 状態更新完了後の処理実行
4. **自動時間リセット**: startTimer時の安全チェック

---

### 3. ローカル vs 本番環境の差異対策

#### 🔍 環境別の特徴
| 項目 | ローカル開発 | GitHub Pages |
|------|------------|--------------|
| パス | 絶対パス (`/`) | 相対パス (`./`) |
| ビルド | HMR有効 | 最適化済み |
| デバッグ | 豊富なログ | 制限あり |
| リロード | 頻繁 | 継続実行 |
| ブラウザ | PC | モバイル |

#### ✅ 対策
```typescript
// vite.config.ts
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',  // 環境別パス設定
  // ...
}));

// デバッグ対策
const addDebugInfo = (message: string) => {
  // 開発環境：コンソールログ
  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
  
  // 本番環境：画面表示（モバイル対応）
  if ('ontouchstart' in window) {
    // ストアにデバッグ情報を保存して画面表示
    useAppStore.getState().addDebugInfo(message);
  }
};
```

**対策ポイント:**
1. **環境別設定**: 開発・本番で適切なパス設定
2. **クロスブラウザ対応**: PC・モバイル両対応
3. **可視化デバッグ**: モバイルでの画面表示デバッグ
4. **継続テスト**: 本番環境での長時間動作確認

---

## 🛡️ 予防策チェックリスト

### React + TypeScript
- [ ] useEffect依存配列の最小化
- [ ] useRefでのDOM・Timer管理
- [ ] useCallbackでの関数メモ化
- [ ] 状態管理ライブラリの非同期性考慮

### タイマー・Interval処理
- [ ] setIntervalの確実なクリア処理
- [ ] 複数インスタンス防止機能
- [ ] 異常状態の自動検知・停止
- [ ] 状態不整合の予防機能

### デプロイ・環境差異
- [ ] 開発・本番の設定分離
- [ ] 相対パス設定の確認
- [ ] クロスブラウザテスト
- [ ] モバイルでの動作確認

### デバッグ・監視
- [ ] 環境別デバッグ方法
- [ ] 画面表示デバッグ機能
- [ ] 状態変化の可視化
- [ ] 長時間動作テスト

---

## 📚 技術的な学び

### Zustand状態管理
```typescript
// ベストプラクティス
const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 状態更新は原子的に
      updateState: () => {
        set(state => ({
          ...state,
          multiple: 'updates',
          at: 'once'
        }));
      },
      
      // 最新状態の確実な取得
      getCurrentState: () => {
        return get(); // 常に最新状態
      }
    }),
    // persist設定
  )
);
```

### React Hooks 最適化
```typescript
// setInterval + useEffect パターン
const useTimer = (isRunning: boolean, callback: () => void) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  // コールバックを最新に保つ
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]); // callbackは依存配列から除外
};
```

---

## 🎯 次回開発時の注意点

### 1. 開発開始時
- [ ] useEffect + setInterval使用時は必ずuseRefパターン採用
- [ ] 状態管理ライブラリの非同期性を考慮した設計
- [ ] 環境別設定の事前準備

### 2. 開発中
- [ ] 本番環境での定期的な動作確認
- [ ] モバイルブラウザでのテスト
- [ ] 長時間動作での問題検証

### 3. デプロイ前
- [ ] 全機能の本番環境テスト
- [ ] パフォーマンス・メモリリーク確認
- [ ] クロスデバイス動作確認

### 4. 問題発生時
- [ ] ローカル・本番の差分分析
- [ ] 状態管理の実行順序確認
- [ ] デバッグ情報の可視化実装

---

## 📖 参考資料

### 関連ドキュメント
- [React useEffect公式ドキュメント](https://react.dev/reference/react/useEffect)
- [Zustand公式ドキュメント](https://zustand-demo.pmnd.rs/)
- [Vite設定ガイド](https://vitejs.dev/guide/)

### 今回修正したファイル
- `src/components/Timer.tsx` - useEffect最適化
- `src/store/index.ts` - 状態管理改善
- `vite.config.ts` - 環境別設定
- `SESSION_STATUS.md` - 状況記録

---

**🎊 今回の成功要因:**
1. **段階的なデバッグ**: 問題を細分化して一つずつ解決
2. **環境差異の認識**: ローカル・本番の違いを正確に把握
3. **多層防御**: 複数の安全機能で確実な動作保証
4. **可視化**: 問題を見える化してデバッグ効率向上

**次回はこの経験を活かして、より効率的な開発ができそうです！🚀**