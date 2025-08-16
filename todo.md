
### M0: 基盤・セットアップ
- [ ] **Bun/Next.js/Tailwind 初期化**: `bun create next`, Tailwind 設定（`tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`）
- [ ] **ディレクトリ構成整備**: `src/app`, `(marketing)`, `(app)`, `api/*`, `components`, `lib`, `themes`, `styles`（制作書 5.1/5.1*）
- [ ] **環境変数**: `.env.local`（`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_APP_URL`, OpenAI, Supabase）
- [ ] **Linter/Formatter**: ESLint/Prettier ルール適用、CI で型・lint チェック
- [ ] **ビルド/起動確認**: `bun dev` で初期ページ起動
- 受け入れ基準: 初期ページが1.5s未満で表示（制作書 4.2）

### M1: エディタ + プレビュー（MVPコア）
- [ ] **`components/Editor.tsx`**: Markdown 入力（両方フルスクリーン切替/ショトカ）
- [ ] **`components/Preview.tsx` + `lib/marp.ts`**: `@marp-team/marp-core` でライブプレビュー（ホットリロード <300ms）
- [ ] **`components/Toolbar.tsx`**: 保存/テーマ/AI/エクスポート
- [ ] **`components/ThemePicker.tsx` + `themes/*`**: 公式＋カスタムテーマ
- [ ] **`app/(app)/editor/[id]/page.tsx`**: 2ペイン UI 組み込み
- [ ] **`app/preview/route.ts`**: SSR プレビュー（必要に応じ）
- 受け入れ基準: 1000行のMarkdownでプレビュー更新待ち <300ms（制作書 4.2）

### M2: エクスポート（HTML/PDF/PNG）
- [ ] **`lib/export.ts`**: HTML→PDF/PNG 変換（Playwright）
- [ ] **`app/api/convert/route.ts`**: `POST md → html/pdf/png` 返却
- [ ] 無料枠: ブラウザ印刷でPDF（透かし）/HTML エクスポート
- [ ] Pro枠: サーバーレンダリングの高品質 PDF/PNG
- 受け入れ基準: 1クリック書き出し、A4 既定、透かし有無がプラン準拠（制作書 6）

### M3: 保存・認証
- [ ] **ローカル保存**: `lib/storage.ts`（IndexedDB/FS Access）
- [ ] **クラウド保存（Pro）**: Supabase（S3/DB）連携
- [ ] **認証**: Supabase Auth or NextAuth（Email/OTP）
- [ ] **ダッシュボード**: `app/(app)/dashboard/page.tsx`（プロジェクト一覧/新規/削除）
- [ ] **設定**: `app/(app)/settings/billing/page.tsx`（課金情報表示/ポータルリンク）
- 受け入れ基準: 未ログインでもローカル保存可能、Pro はクラウド保存可（制作書 6）

### M4: 課金（Stripe）
- [ ] **Pricing ページ**: `app/(marketing)/pricing/page.tsx`（月/年トグル、比較表、CTA）
- [ ] **Checkout**: `app/api/billing/create/route.ts`（`Stripe.checkout.sessions.create`）
- [ ] **Portal**: `app/api/billing/portal/route.ts`（プラン変更/解約）
- [ ] **Webhook**: `app/api/webhooks/stripe/route.ts`（`customer.subscription.*` を検証・同期）
- [ ] **`lib/billing.ts`**: `assertPro(user)` 実装、クライアント/サーバ共通判定
- [ ] **`components/Paywall.tsx`/`SubscriptionBanner.tsx`**: 機能ロック表示
- [ ] **DB モデル**: `UserBilling`（`userId, stripeCustomerId, subscriptionStatus, priceId, currentPeriodEnd`）
- 受け入れ基準: Checkout→Success→Webhookで`active`、解約で即ロック（制作書 19.8）

### M5: AI アシスト
- [ ] **`lib/llm.ts`**: OpenAI 抽象（プロバイダ差し替え可能）
- [ ] **`app/api/ai/assist/route.ts`**: アウトライン/要約/ノート生成 API
- [ ] **Toolbar 実装**: 生成・挿入・差し替え UI、クォータ管理（無料枠制限）
- 受け入れ基準: 長文貼り付けから骨子/要約/ノートを3クリック以内で生成

### M6: マーケ/ルート構成
- [ ] **LP**: `app/(marketing)/page.tsx`（製品概要/価値）
- [ ] **ルート**: `app/page.tsx`（LPへリダイレクト or ガード）
- [ ] **`app/(app)/layout.tsx`**: 認証後の共通レイアウト（ナビ/ペイウォール）
- 受け入れ基準: 未ログインはLP/価格へ導線、ログイン済はダッシュボードへ

### M7: 非機能・PWA・パフォーマンス
- [ ] 初期表示 <1.5s、インタラクティブ <3s（実測）
- [ ] 画像/フォント最適化、分割コード、RSC/Suspense 適用
- [ ] **PWA**: オフライン作業、直近プロジェクトの閲覧/編集
- [ ] 監視/ロギング（基本的な SSR/API ログ）
- 受け入れ基準: Lighthouse PWA 合格、Core Web Vitals 良好

### M8: テスト・品質保証
- [ ] ユニット: `lib/*`（marp/export/ai/billing）
- [ ] ルート/API 結合: Checkout/Portal/Webhook/Convert/Assist
- [ ] E2E（主要フロー）: 新規→編集→プレビュー→エクスポート→Checkout→Pro機能解放
- [ ] 回帰: 解約→`canceled` 反映→エクスポート/AI/クラウド保存がロック（制作書 19.8）
- 受け入れ基準: CI 緑、主要フロー100%合格

### M9: リリース準備
- [ ] 本番ビルド/デプロイ（環境に合わせ最適化）
- [ ] Stripe Webhook 本番設定、価格ID・キー差替え
- [ ] Supabase 本番プロジェクト/権限、ストレージバケット
- [ ] バージョニング/CHANGELOG、README 簡易利用手順
- 受け入れ基準: 本番環境で無料/Pro 両動作、課金・保存・エクスポートが仕様通り
