# WEMARP_AI

> **目的**: Marp 形式（Markdown + front‑matter）から、即時プレビュー・テーマ選択・エクスポート（HTML/PDF/PNG）を提供し、さらに**サブスク型マネタイズ**を備えた軽量スライド生成ツールを **Bun × Next.js (App Router) × Tailwind CSS** で実装する。

---

## 1. プロダクト概要

* **製品名**: wemarp\_ai
* **一言説明**: 「Marp で書く、AIで整える、即プレゼン。」
* **ターゲット**: 学生・登壇者・社内勉強会主催者・資料を高速に回したい個人開発者
* **主要価値**

  * Marp 互換（既存の Markdown で流用可能）
  * ブラウザ上で即プレビュー（ホットリロード）
  * AI アシスト（章立て提案・要約・スピーカーノート生成）
  * 1クリック書き出し（HTML / PDF / PNG）
  * **マネタイズ**: 有料プランで高度なテーマ・AI機能・クラウド保存

## 2. ユースケース

1. Markdown を貼り付け→テンプレ選択→即発表
2. テキストから AI がスライド骨子を自動生成
3. 既存 README / 論文要約をプレゼン化
4. 有料プランで高品質 PDF/PNG 変換・クラウド共有

## 3. 競合と差別化

* **Marp CLI / VSCode 拡張**: ローカル依存。→ **クラウドレスでもブラウザ完結**、AI アシスト同梱。
* **Gamma / Tome**: リッチだが独自フォーマット。→ **Marp 準拠**で移行が容易。さらにプロンプトの改善でより**らしいスライド資料**を提供
* **差別化点**: サブスク課金を前提に「AI + Marp 公式互換 + クラウド保存」を統合。

## 4. 要件

### 4.1 機能要件（MVP）

* [ ] Markdown エディタ（2ペイン）
* [ ] ライブプレビュー（marp-core）
* [ ] テーマ選択（公式 + カスタム）
* [ ] エクスポート：HTML / PDF / PNG
* [ ] AI アシスト：アウトライン・要約・ノート生成
* [ ] プロジェクト保存：ローカル IndexedDB
* [ ] **サブスク課金**：Stripe Billing 連携

  * 無料: HTMLプレビュー・印刷エクスポート
  * 有料: サーバーPDF/PNG、AI強化、クラウド保存、テーマ拡張

### 4.2 非機能要件

* 初期表示 < 1.5s
* 変換待ち < 300ms
* PWA対応（オフライン作業）

## 5. 技術構成

* **Runtime**: Bun 1.x
* **Framework**: Next.js 14+ App Router
* **UI**: Tailwind CSS
* **Markdown → Slide**: `@marp-team/marp-core`
* **PDF/PNG 出力**: サーバーサイド Playwright
* **状態管理**: RSC + Client Hooks (Zustand)
* **保存**: IndexedDB → 有料クラウド (Supabase/S3)
* **AI**: OpenAI API (抽象レイヤー)
* **課金**: Stripe Checkout + Billing
* **認証**: NextAuth.js + Supabase Auth

### 5.1 ディレクトリ構成（App Router対応）

```
wemarp_ai/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                # Editor + Preview
│  │  ├─ preview/route.ts        # Slide SSRプレビュー
│  │  ├─ api/
│  │  │  ├─ convert/route.ts     # md→html/pdf/png
│  │  │  ├─ ai/assist/route.ts   # AIアシスト
│  │  │  └─ billing/webhook.ts   # Stripe webhook
│  │  ├─ dashboard/page.tsx      # 課金ユーザー向けダッシュボード
│  │  └─ pricing/page.tsx        # 料金プランページ
│  ├─ components/
│  │  ├─ Editor.tsx
│  │  ├─ Preview.tsx
│  │  ├─ Toolbar.tsx
│  │  ├─ ThemePicker.tsx
│  │  └─ SubscriptionBanner.tsx
│  ├─ lib/
│  │  ├─ marp.ts
│  │  ├─ export.ts
│  │  ├─ storage.ts
│  │  ├─ ai.ts
│  │  └─ stripe.ts
└─ public/
```

## 6. マネタイズ設計

* **無料プラン**

  * Markdownエディタ
  * 基本プレビュー
  * ローカル保存
  * 印刷経由のPDF出力
* **有料プラン（月額/年額）**

  * サーバーレンダリングPDF/PNG（高品質）
  * AI拡張（アウトライン/ノート/翻訳）
  * クラウド保存（Supabase S3）
  * テーマギャラリー拡張

### Stripe 実装フロー

1. `/pricing` で Checkout セッション開始
2. Stripe Billing でサブスク管理
3. Webhook `/api/billing/webhook` で status 反映
4. DB (Supabase) に `user.subscription_status` を保持
5. Client: `useSubscription()` hook で gating

## 7. API 設計（追加）

### 7.1 POST /api/billing/checkout

* **req**: `{ plan: 'pro-monthly'|'pro-yearly' }`
* **res**: `{ url: string } // Stripe Checkout`

### 7.2 POST /api/billing/webhook

* **Stripe Event**: `checkout.session.completed` / `invoice.paid` / `customer.subscription.updated`
* **Action**: Supabaseにsubscription状態を保存

---

## 8. 開発タスク（追加）

* [ ] Stripe ダッシュボード設定
* [ ] `/pricing` ページ作成
* [ ] Checkout API 実装
* [ ] Webhook ハンドラ
* [ ] Subscription 状態に応じた機能制御
* [ ] Supabase integration（ユーザーテーブル拡張）

---

### 5.1\* ディレクトリ構成（App Router・拡張版）

```
wemarp_ai/
├─ bunfig.toml
├─ package.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ .env.local                       # STRIPE_*, NEXT_PUBLIC_*
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/               # LP/料金/利用規約など公開ページ
│  │  │  ├─ page.tsx
│  │  │  └─ pricing/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx              # 認証後のアプリ共通レイアウト
│  │  │  ├─ dashboard/page.tsx      # プロジェクト一覧
│  │  │  ├─ editor/[id]/page.tsx    # エディタ+プレビュー
│  │  │  └─ settings/billing/page.tsx
│  │  ├─ api/
│  │  │  ├─ convert/route.ts        # md→html/pdf/png
│  │  │  ├─ ai/assist/route.ts      # AI補助
│  │  │  ├─ billing/create/route.ts # Stripe Checkout セッション生成
│  │  │  ├─ billing/portal/route.ts # Stripe カスタマーポータル
│  │  │  └─ webhooks/stripe/route.ts# Stripe Webhook (サブスク状態同期)
│  │  └─ page.tsx                   # ルート（LP へリダイレクト）
│  ├─ components/
│  │  ├─ Editor.tsx
│  │  ├─ Preview.tsx
│  │  ├─ Toolbar.tsx
│  │  ├─ ThemePicker.tsx
│  │  └─ Paywall.tsx                # ペイウォール/機能ロック表示
│  ├─ lib/
│  │  ├─ marp.ts                    # marp-core ラッパ
│  │  ├─ export.ts                  # HTML→PDF/PNG
│  │  ├─ storage.ts                 # IndexedDB/FS Access
│  │  ├─ ai.ts                      # AI provider 抽象
│  │  ├─ auth.ts                    # 認証（Supabase or NextAuth）
│  │  └─ billing.ts                 # Stripe SDK ラッパと権限判定
│  ├─ styles/
│  │  └─ globals.css
│  └─ themes/
└─ public/
```

---

## 19. サブスク（マネタイズ）設計

### 19.1 方針

* **方式**: Stripe 定額サブスク（月額/年額）。無料枠 + Pro。
* **無料枠**: プロジェクト 3 件 / PDF 透かし / AI クォータ少
* **Pro**: 透かしなし、PNG/PDF エクスポート無制限、AI クォータ拡張、テーマ追加
* **認証**: Supabase Auth（Email/OTP）を想定（NextAuth でも代替可）

### 19.2 データモデル（最小）

```ts
// appユーザー ←→ Stripe 顧客ID 紐づけ
export type UserBilling = {
  userId: string;           // 認証プロバイダのID
  stripeCustomerId: string;
  subscriptionStatus: 'none'|'active'|'past_due'|'canceled';
  priceId?: string;         // 現在のプラン
  currentPeriodEnd?: number;// epoch sec
};
```

### 19.3 構成

* **Checkout**: `/api/billing/create` で `Stripe.checkout.sessions.create`
* **Portal**: `/api/billing/portal` で顧客がプラン変更/解約
* **Webhook**: `/api/webhooks/stripe` で `customer.subscription.*` を受信し `UserBilling` を更新
* **ゲーティング**: `lib/billing.ts` の `assertPro(user)` でサーバ/クライアント両方から判定

### 19.4 ルートハンドラ（概略）

```ts
// src/app/api/billing/create/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { priceId, customerId, origin } = await req.json();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId, // 無ければ customer_creation: 'always'
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });
  return NextResponse.json({ url: session.url });
}
```

```ts
// src/app/api/billing/portal/route.ts
export async function POST(req: Request) {
  const { customerId, origin } = await req.json();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/settings/billing`,
  });
  return Response.json({ url: session.url });
}
```

```ts
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');
  // event 検証 → type に応じて UserBilling を更新
  // 'customer.subscription.created|updated|deleted'
  return new Response('ok');
}
```

### 19.5 機能ゲーティング例

```tsx
// サーバ側 (RSC) で権限判定→UI分岐
import { assertPro } from '@/lib/billing';
export default async function ExportButton() {
  const ok = await assertPro();
  if (!ok) return <Paywall feature="export"/>;
  return <button className="btn">Export PDF</button>;
}
```

### 19.6 料金ページ（UI 指針）

* 月/年トグル、無料/Pro 比較表、CTA（サインイン→Checkout）
* 学生割引・教育機関クーポンは v1.1 で検討

### 19.7 .env（例）

```
STRIPE_SECRET_KEY=sk_live_***
STRIPE_WEBHOOK_SECRET=whsec_***
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_***
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 19.8 テスト観点

* Checkout→Success→Webhook `active` 反映
* 解約→`canceled` 反映、Pro 機能が即座にロック
* 透かし/エクスポート制限/AI クォータが無料枠で正しく働く

### 19.9 将来拡張

* 学割、チームプラン、組織請求
* Usage-based（AIトークン従量）併用
* レシート/請求書の日本語テンプレ対応
