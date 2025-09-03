#!/usr/bin/env node

/**
 * GitHub Pagesデプロイ前チェックスクリプト
 * 使用方法: node scripts/check-deploy.js
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 GitHub Pagesデプロイ前チェックを開始します...\n');

let hasErrors = false;

// 1. ビルドファイルの存在確認
console.log('📁 ビルドファイルの確認:');
const requiredFiles = [
  'dist/index.html',
  'dist/assets',
  'index.html',
  '404.html',
  'assets'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file} - 存在`);
  } else {
    console.log(`  ❌ ${file} - 不足`);
    hasErrors = true;
  }
});

// 2. index.htmlのパス確認
console.log('\n🔗 index.htmlのパス確認:');
try {
  const indexContent = fs.readFileSync('index.html', 'utf8');
  
  // 絶対パスの検出
  const absolutePaths = indexContent.match(/(?:href|src)="\/[^"]*"/g);
  if (absolutePaths) {
    console.log('  ❌ 絶対パスが検出されました:');
    absolutePaths.forEach(path => {
      console.log(`    ${path}`);
    });
    hasErrors = true;
  } else {
    console.log('  ✅ パスは相対パスで正しく設定されています');
  }
  
  // JSファイルの参照確認
  const jsMatch = indexContent.match(/src="([^"]*\.js)"/);
  if (jsMatch) {
    const jsFile = jsMatch[1].replace('./', '');
    if (fs.existsSync(jsFile)) {
      console.log(`  ✅ JSファイル参照: ${jsFile} - 存在`);
    } else {
      console.log(`  ❌ JSファイル参照: ${jsFile} - 不足`);
      hasErrors = true;
    }
  }
  
  // デプロイ時の重要チェック：ビルド後ファイルがコミットされているかを確認
  const distJsMatch = indexContent.match(/src="\.\/assets\/([^"]*\.js)"/);
  if (distJsMatch) {
    const distJsFile = `assets/${distJsMatch[1]}`;
    if (!fs.existsSync(distJsFile)) {
      console.log(`  ❌ デプロイ用JSファイルが不足: ${distJsFile}`);
      console.log(`  💡 解決方法: npm run build を実行してから npm run prepare-deploy を実行してください`);
      hasErrors = true;
    }
  }
  
} catch (error) {
  console.log('  ❌ index.htmlの読み込みエラー:', error.message);
  hasErrors = true;
}

// 3. assetsフォルダの内容確認
console.log('\n📦 assetsフォルダの確認:');
try {
  const assetsFiles = fs.readdirSync('assets');
  if (assetsFiles.length > 0) {
    console.log(`  ✅ assetsファイル数: ${assetsFiles.length}`);
    assetsFiles.forEach(file => {
      console.log(`    - ${file}`);
    });
  } else {
    console.log('  ❌ assetsフォルダが空です');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ assetsフォルダの読み込みエラー:', error.message);
  hasErrors = true;
}

// 4. package.jsonのスクリプト確認
console.log('\n📋 package.jsonスクリプトの確認:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'dev'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ ${script}スクリプト: ${packageJson.scripts[script]}`);
    } else {
      console.log(`  ❌ ${script}スクリプトが不足`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ❌ package.jsonの読み込みエラー:', error.message);
  hasErrors = true;
}

// 5. vite.config.tsの設定確認
console.log('\n⚙️  Vite設定の確認:');
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  
  if (viteConfig.includes('base:')) {
    console.log('  ✅ base設定が存在');
    const baseMatch = viteConfig.match(/base:\s*['"`]([^'"`]*)['"`]/);
    if (baseMatch) {
      console.log(`    base: "${baseMatch[1]}"`);
    }
  } else {
    console.log('  ⚠️  base設定が見つかりません（GitHub Pagesでサブディレクトリを使う場合は必要）');
  }
} catch (error) {
  console.log('  ❌ vite.config.tsの読み込みエラー:', error.message);
  hasErrors = true;
}

// 結果表示
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ エラーが検出されました。デプロイ前に修正してください。');
  process.exit(1);
} else {
  console.log('✅ すべてのチェックに合格しました！デプロイ可能です。');
}

console.log('\n📚 デプロイ手順:');
console.log('1. npm run build');
console.log('2. node scripts/check-deploy.js');
console.log('3. git add . && git commit -m "Update build for deployment"');
console.log('4. git push origin main');
console.log('5. 数分待ってからhttps://username.github.io/repository/を確認');