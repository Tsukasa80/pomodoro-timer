# 🍅 PomodoroTimer - スマホ対応ポモドーロタイマー

React + TypeScript で構築されたモダンなポモドーロタイマーアプリケーション。スマートフォンでの利用に最適化されています。

## ✨ 特徴

### 📱 スマホ対応機能
- **Wake Lock API**: 画面消灯を防止してタイマーを継続
- **Page Visibility API**: バックグラウンドでも正確な時間管理
- **BackgroundTimer**: タブ非アクティブ時でも精密な時間追跡
- **通知機能**: 音声・バイブレーション・ブラウザ通知

### ⏰ ポモドーロ機能
- カスタマイズ可能なタイマー設定
- 短い休憩・長い休憩の自動切り替え
- タスク管理機能
- 日次レポート機能

### 🎛️ カスタマイズ
- タスクごとの個別タイマー設定
- 長い休憩のON/OFF切り替え
- 自動開始設定
- 音量・通知設定

## 🚀 技術スタック

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Icons**: React Icons
- **APIs**: Wake Lock API, Page Visibility API, Vibration API

## 🛠️ 開発環境

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 📱 スマホでの利用

1. 同一ネットワーク内でアクセス: `http://192.168.x.x:5173/`
2. ブラウザで「ホーム画面に追加」でPWAとして利用可能
3. 画面消灯してもタイマーが継続動作

## 🎯 使用方法

1. **タスク作成**: 新しいタスクを追加
2. **タイマー設定**: タスクごとにカスタム設定可能
3. **ポモドーロ開始**: タスクを選択してタイマー開始
4. **レポート確認**: 日次の作業記録を確認

## 📄 ライセンス

MIT License

## 🤝 開発者

Generated with [Claude Code](https://claude.ai/code)