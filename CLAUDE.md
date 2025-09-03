すべて日本語で回答してください。
励まして応援している親友のように回答してください。

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

# 開発・デプロイガイド

## 🔍 開発前チェック

開発サーバー起動前に必ず実行してください：

```bash
npm run check-dev
```

このコマンドで以下を自動確認：
- ✅ Vite設定のbase設定（開発・本番環境の整合性）
- ✅ index.htmlのスクリプト参照（相対パス/絶対パスの確認）
- ✅ プロジェクト構造の確認
- ✅ 開発環境の設定確認

**よくある開発時の問題と解決法：**
- 🚨 **白い画面になる場合**: パス設定の不整合が原因です
- 💡 **解決方法**: `npm run check-dev` で問題を特定し、指示に従って修正

---

# GitHub Pagesデプロイガイド

## 🚀 安全なデプロイ手順

GitHub Pagesへのデプロイで問題を避けるため、以下の手順を必ず守ってください：

### 1. 事前チェック（必須）
```bash
npm run check-deploy
```

このコマンドで以下を自動確認：
- ✅ ビルドファイルの存在
- ✅ パス設定の妥当性
- ✅ JSファイルの参照確認
- ✅ assetsフォルダの内容
- ✅ package.jsonスクリプト

### 2. 完全デプロイ（推奨）
```bash
npm run deploy
```

このコマンドが自動実行：
1. `npm run build` - TypeScript + Viteビルド
2. `npm run prepare-deploy` - ファイル配置
3. `npm run check-deploy` - 最終確認

### 3. 手動デプロイ（上級者向け）
```bash
# ビルド
npm run build

# ファイル配置
cp -r dist/* .
mkdir -p assets && cp -r dist/assets/* assets/
cp index.html 404.html

# 確認
npm run check-deploy

# Git操作
git add .
git commit -m "Update build for deployment"
git push origin main
```

## 🔍 トラブルシューティング

### よくある問題と解決法

#### 1. 白い画面が表示される
**原因**: JSファイルのパス間違い
**解決**: `index.html`のsrc属性を確認
```html
<!-- ❌ 間違い -->
<script src="/pomodoro-timer/assets/index-xxx.js">
<!-- ✅ 正しい -->
<script src="./assets/index-xxx.js">
```

#### 2. 404エラーが表示される
**原因**: GitHub PagesがGitHub Actionsを使用している
**解決**: 
- `.github/workflows/deploy.yml`を無効化
- mainブランチから直接配信に変更

#### 3. CSSが適用されない
**原因**: CSSファイルのパス間違い
**解決**: `index.html`のhref属性を確認
```html
<!-- ❌ 間違い -->
<link rel="stylesheet" href="/pomodoro-timer/assets/style.css">
<!-- ✅ 正しい -->
<link rel="stylesheet" href="./assets/style.css">
```

## 📋 デプロイ前チェックリスト

- [ ] `npm run build` が成功する
- [ ] `npm run check-deploy` でエラーなし
- [ ] `index.html` のパスがすべて相対パス（`./`）
- [ ] `assets/` フォルダにJSとCSSが存在
- [ ] `404.html` が存在（SPA対応）
- [ ] GitHub Actionsワークフローが無効
- [ ] ローカルで `npm run preview` が正常動作

## 🛠 設定ファイル重要ポイント

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/pomodoro-timer/', // GitHub Pages サブディレクトリ用
  server: {
    host: true,
    port: 5173,
  },
})
```

### package.json scripts
```json
{
  "scripts": {
    "deploy": "npm run build && npm run prepare-deploy && npm run check-deploy",
    "check-deploy": "node scripts/check-deploy.js",
    "prepare-deploy": "cp -r dist/* . && mkdir -p assets && cp -r dist/assets/* assets/ && cp index.html 404.html"
  }
}
```

## 📞 サポート

デプロイで問題が発生した場合：

1. まず `npm run check-deploy` を実行
2. エラーメッセージを確認
3. このガイドの該当する解決法を適用
4. それでも解決しない場合は、開発チームに相談

**重要**: デプロイ前に必ず `npm run check-deploy` を実行してください！