#!/usr/bin/env node

console.log('🔍 開発環境チェックを開始します...\n');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let hasError = false;

// Vite設定ファイルのチェック
console.log('⚙️  Vite設定の確認:');
try {
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // base設定が動的に設定されているかチェック
  if (viteConfig.includes('command === \'build\'')) {
    console.log('  ✅ base設定が動的に設定されています (開発: "/", 本番: "/pomodoro-timer/")');
  } else if (viteConfig.includes('base: \'/pomodoro-timer/\'')) {
    console.log('  ⚠️  base設定が固定値 "/pomodoro-timer/" になっています');
    console.log('     → 開発時に白い画面になる可能性があります');
    hasError = true;
  } else if (viteConfig.includes('base: \'/\'')) {
    console.log('  ⚠️  base設定が固定値 "/" になっています');
    console.log('     → GitHub Pagesデプロイ時に問題が発生する可能性があります');
  } else {
    console.log('  ✅ base設定が見つかりません (デフォルト値 "/" が使用されます)');
  }
} catch (error) {
  console.log('  ❌ vite.config.tsが見つかりません');
  hasError = true;
}

// index.htmlのパスチェック
console.log('\n🔗 index.htmlのパス確認:');
try {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  
  // スクリプトタグのsrc属性をチェック
  const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+)"/);
  if (scriptMatch) {
    const srcPath = scriptMatch[1];
    console.log(`  📄 スクリプト参照: ${srcPath}`);
    
    if (srcPath === './src/main.tsx') {
      console.log('  ✅ 開発用の相対パス設定が正しく設定されています');
    } else if (srcPath === '/src/main.tsx') {
      console.log('  ⚠️  絶対パス "/src/main.tsx" が使用されています');
      console.log('     → Viteのbase設定が "/" の場合、白い画面になる可能性があります');
      hasError = true;
    } else if (srcPath.includes('/assets/')) {
      console.log('  ⚠️  ビルド後のファイルパスが使用されています');
      console.log('     → 開発時に正常に動作しない可能性があります');
      hasError = true;
    }
  } else {
    console.log('  ❌ スクリプトタグが見つかりません');
    hasError = true;
  }
  
  // CSSリンクタグもチェック
  const cssMatch = indexHtml.match(/<link[^>]+href="([^"]+\.css)"/);
  if (cssMatch) {
    const cssPath = cssMatch[1];
    if (cssPath.includes('/assets/')) {
      console.log('  ⚠️  ビルド後のCSSファイルが参照されています');
      console.log('     → 開発時にスタイルが適用されない可能性があります');
    }
  }
} catch (error) {
  console.log('  ❌ index.htmlが見つかりません');
  hasError = true;
}

// srcディレクトリの存在チェック
console.log('\n📁 プロジェクト構造の確認:');
const srcPath = path.join(__dirname, '..', 'src');
const mainTsxPath = path.join(srcPath, 'main.tsx');

if (fs.existsSync(srcPath)) {
  console.log('  ✅ src ディレクトリが存在します');
  
  if (fs.existsSync(mainTsxPath)) {
    console.log('  ✅ src/main.tsx が存在します');
  } else {
    console.log('  ❌ src/main.tsx が見つかりません');
    hasError = true;
  }
} else {
  console.log('  ❌ src ディレクトリが見つかりません');
  hasError = true;
}

// Node.jsのバージョンチェック
console.log('\n🔧 環境の確認:');
console.log(`  📦 Node.js: ${process.version}`);

// package.jsonの開発用スクリプトチェック
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.dev) {
    console.log(`  ✅ 開発用スクリプト: ${packageJson.scripts.dev}`);
  } else {
    console.log('  ❌ package.jsonに開発用スクリプトが見つかりません');
    hasError = true;
  }
} catch (error) {
  console.log('  ❌ package.jsonの読み込みに失敗しました');
  hasError = true;
}

// 結果の表示
console.log('\n' + '='.repeat(50));
if (hasError) {
  console.log('❌ 問題が検出されました。上記のエラーを修正してください。');
  console.log('\n💡 よくある解決方法:');
  console.log('   • vite.config.tsでbase設定を動的にする');
  console.log('   • index.htmlで相対パス "./src/main.tsx" を使用する');
  console.log('   • 開発時は npm run dev、デプロイ時は npm run deploy を使用する');
  process.exit(1);
} else {
  console.log('✅ 開発環境の設定に問題ありません！');
  console.log('\n🚀 npm run dev でサーバーを起動できます');
}