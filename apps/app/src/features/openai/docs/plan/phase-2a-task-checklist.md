# Phase 2A 実装タスクリスト - 詳細チェックリスト

**プロジェクト**: GROWI エディターアシスタント改修  
**フェーズ**: Phase 2A完遂  
**作成日**: 2025-06-17  
**見積工数**: 8-12時間

## 📋 **タスク実行チェックリスト**

### **🔴 Task 1: スキーマ強化** `[1時間]` `[ ]完了`

#### 1.1 LLMレスポンススキーマ更新 `[ ]`
- [ ] `llm-response-schemas.ts`の`startLine`を必須に変更
- [ ] バリデーションメッセージ更新
- [ ] TypeScript型定義更新

**ファイル**: `/apps/app/src/features/openai/interfaces/editor-assistant/llm-response-schemas.ts`

```typescript
// 変更前: startLine が optional
startLine: z.number().int().positive().optional()

// 変更後: startLine が required
startLine: z.number().int().positive().describe('Starting line number for search (1-based, REQUIRED)')
```

#### 1.2 プロンプト更新 `[ ]`
- [ ] `edit/index.ts`のinstruction関数更新
- [ ] `startLine`必須化の明記
- [ ] 例示の追加

**ファイル**: `/apps/app/src/features/openai/server/routes/edit/index.ts`

### **🔴 Task 2: search-replace処理実装** `[4-5時間]` `[ ]完了`

#### 2.1 search-replace-engine.ts作成 `[ ]`
- [ ] 新ファイル作成
- [ ] `performSearchReplace`関数実装
- [ ] YText統合ロジック実装

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/search-replace-engine.ts`

#### 2.2 useEditorAssistant更新 `[ ]`
- [ ] useEffect内のdiff処理ロジック変更
- [ ] 既存の`appendTextLastLine`をフォールバックに変更
- [ ] search-replace-engine統合

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/use-editor-assistant.tsx`

```typescript
// 変更対象: useEffect内のpendingDetectedDiff.forEach処理
// 現在: replaceのみ使用
// 変更後: searchとreplaceの両方使用 + 行番号指定
```

#### 2.3 index.tsエクスポート更新 `[ ]`
- [ ] 新しい関数のエクスポート追加

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/index.ts`

### **🔴 Task 3: Fuzzy Matching統合** `[2時間]` `[ ]完了`

#### 3.1 fuzzy-matching.ts機能拡張 `[ ]`
- [ ] `SearchContext`インターフェース更新
- [ ] `MatchResult`インターフェース更新
- [ ] `preferredStartLine`対応実装
- [ ] `tryExactLineMatch`メソッド実装
- [ ] `performBufferedSearch`メソッド実装

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/fuzzy-matching.ts`

#### 3.2 text-normalization.ts確認 `[ ]`
- [ ] 既存実装の動作確認
- [ ] 必要に応じて微調整

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/text-normalization.ts`

### **🔴 Task 4: エラーハンドリング強化** `[1時間]` `[ ]完了`

#### 4.1 error-handling.ts更新 `[ ]`
- [ ] `SearchReplaceError`インターフェース追加
- [ ] `createSearchError`関数実装
- [ ] 詳細エラーメッセージ定義

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/error-handling.ts`

#### 4.2 エラーメッセージ国際化 `[ ]`
- [ ] 日本語エラーメッセージ追加（必要に応じて）

### **🔴 Task 5: クライアントエンジン統合更新** `[2時間]` `[ ]完了`

#### 5.1 client-engine-integration.tsx更新 `[ ]`
- [ ] `processDetectedDiffsClient`関数完成
- [ ] `startLine`必須チェック実装
- [ ] エラーハンドリング強化

**ファイル**: `/apps/app/src/features/openai/client/services/client-engine-integration.tsx`

#### 5.2 processor.ts統合確認 `[ ]`
- [ ] 既存のprocessor.tsとの整合性確認
- [ ] 必要に応じて調整

**ファイル**: `/apps/app/src/features/openai/client/services/editor-assistant/processor.ts`

### **🔴 Task 6: テスト実行** `[1-2時間]` `[ ]完了`

#### 6.1 手動テスト `[ ]`
- [ ] 基本search-replace動作確認
- [ ] Fuzzy matching動作確認
- [ ] 複数diff処理確認
- [ ] エラーケース確認
- [ ] パフォーマンステスト

#### 6.2 テストケース実行 `[ ]`

**テストケース1: 正確な検索・置換**
```json
{
  "search": "function calculateTotal(items) {\n  let total = 0;",
  "replace": "function calculateTotal(items) {\n  let total = 0;\n  // Added comment",
  "startLine": 15
}
```
- [ ] 実行結果: `[ ]成功` `[ ]失敗`

**テストケース2: Fuzzy matching**
```json
{
  "search": "function calculateTotal(items) {\n let total = 0;",
  "replace": "function calculateSum(items) {\n  let sum = 0;",
  "startLine": 15
}
```
- [ ] 実行結果: `[ ]成功` `[ ]失敗`

**テストケース3: 複数diff処理**
- [ ] 5個以上のdiffの同時処理
- [ ] 実行結果: `[ ]成功` `[ ]失敗`

**テストケース4: エラーハンドリング**
- [ ] 存在しない行番号指定
- [ ] 検索テキストが見つからない場合
- [ ] 実行結果: `[ ]適切なフォールバック` `[ ]エラー発生`

#### 6.3 パフォーマンステスト `[ ]`
- [ ] 1000行ファイルでの検索時間: `____ms`
- [ ] 10箇所同時置換時間: `____ms`
- [ ] メモリ使用量: `____MB`
- [ ] UI blocking時間: `____ms`

### **🔴 Task 7: 品質確認** `[30分]` `[ ]完了`

#### 7.1 ESLint/TypeScript確認 `[ ]`
- [ ] `cd /workspace/growi/apps/app && turbo run lint`
- [ ] エラー0件確認
- [ ] 警告の対応

#### 7.2 ビルド確認 `[ ]`
- [ ] `cd /workspace/growi/apps/app && turbo run build`
- [ ] ビルド成功確認

## 📊 **進捗トラッキング**

### **完了状況**
- Task 1: `[ ]完了` `____時間`
- Task 2: `[ ]完了` `____時間`  
- Task 3: `[ ]完了` `____時間`
- Task 4: `[ ]完了` `____時間`
- Task 5: `[ ]完了` `____時間`
- Task 6: `[ ]完了` `____時間`
- Task 7: `[ ]完了` `____時間`

**合計工数**: `____時間` / 8-12時間見積

### **成功指標達成状況**
- [ ] 行番号指定での正確な検索: 95%以上の成功率
- [ ] Fuzzy matching: 80%以上の類似度で検索成功  
- [ ] 複数diff処理: 5個以上のdiffの同時処理
- [ ] エラーハンドリング: 検索失敗時の適切なフォールバック
- [ ] 検索時間: 1000行以下で100ms以内
- [ ] 置換時間: 10箇所以下で500ms以内
- [ ] メモリ使用量: 10MB以下
- [ ] ブラウザ応答性: UI blocking 0秒

## 🐛 **問題・課題記録**

### **遭遇した問題**
1. **問題**: `_____________________________`
   - **解決策**: `_____________________________`
   - **所要時間**: `____時間`

2. **問題**: `_____________________________`
   - **解決策**: `_____________________________`
   - **所要時間**: `____時間`

### **技術的判断**
1. **判断**: `_____________________________`
   - **理由**: `_____________________________`
   - **影響**: `_____________________________`

## ✅ **Phase 2A完遂確認**

### **最終チェック項目**
- [ ] すべてのタスクが完了
- [ ] 成功指標をすべて達成
- [ ] ESLintエラー0件
- [ ] ビルド成功
- [ ] 手動テストすべて成功

### **完遂宣言**
- [ ] **Phase 2A完遂**: 実用的なsearch-replace機能の実装完了
- **完遂日**: `2025-__-__`
- **実績工数**: `____時間`
- **品質確認**: `✅済み`

---

**次のステップ**: Phase 2B サーバー最適化 または Phase 3 ハイブリッド統合
