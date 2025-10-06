# WeMarp AI - セットアップガイド

## 実装完了した機能

### ✅ フェーズ1: MVP基盤 (完了)

1. **ホームページ** (`/`)
   - ログイン/デモへのリンク

2. **認証システム** (`/login`)
   - Google OAuth
   - GitHub OAuth
   - NextAuth.js + Prisma

3. **データベーススキーマ**
   - User, Project, Version, Generation, Export, Tag
   - RLSポリシー設定済み
   - Supabase Auth連携

4. **生成API** (`/api/generate`)
   - プロンプト → Marp Markdown生成
   - LLM: gpt-5-mini (OpenAI Responses API対応)
   - DB保存: Project + Version + Generation
   - 無料枠: 20回/日

5. **ダッシュボード** (`/dashboard`)
   - プロジェクト一覧
   - 新規作成ボタン

6. **新規作成** (`/new`)
   - プロンプト入力
   - テーマ選択 (default/gaia/uncover)
   - トーン選択 (business/academic/casual)

7. **エディタ** (`/editor/[id]`)
   - Markdown エディタ
   - marp-core ライブプレビュー
   - バージョン履歴 (最近5件)
   - 保存機能
   - Markdown直接ダウンロード

8. **エクスポートAPI** (`/api/export`)
   - ジョブ作成 (PNG/PDF/HTML)
   - ⚠️ 実際のレンダリングは未実装 (Phase 2)

---

## セットアップ手順

### 1. 環境変数の設定

`.env.local` を確認・更新:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://igxpotauaclvmctddcxu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Database (Supabaseから取得)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.igxpotauaclvmctddcxu.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MAX_RETRIES=3
OPENAI_RETRY_BASE_MS=250
OPENAI_TIMEOUT_MS=60000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# OAuth Providers
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. データベースマイグレーション

Supabaseダッシュボード → SQL Editor で実行:

```bash
# マイグレーションファイル
supabase/migrations/20250104000000_init_schema.sql
```

または、Prismaを使用:

```bash
# DATABASE_URLを設定後
npx prisma migrate dev
npx prisma generate
```

### 3. OAuth設定

#### GitHub OAuth
1. https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Client ID/Secret を `.env.local` に設定

#### Google OAuth
1. https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Client ID/Secret を `.env.local` に設定

### 4. 開発サーバー起動

```bash
npm install
npm run dev
```

→ http://localhost:3000

---

## 使い方

1. **ログイン**: `/login` から Google/GitHub でログイン
2. **新規作成**: `/new` でプロンプト入力 → スライド生成
3. **編集**: `/editor/[id]` で Markdown 編集 + プレビュー
4. **保存**: エディタで「保存」→ 新バージョン作成
5. **エクスポート**: Markdown DL は即座に可能、PNG/PDF は Phase 2 実装予定

---

## 次のステップ (Phase 2)

### 🚧 未実装機能

1. **PNG/PDF レンダリング**
   - Marp CLI + Puppeteer 統合
   - Vercel Serverless Function (Node.js runtime)
   - Supabase Storage 連携

2. **バックグラウンドジョブ**
   - レンダリングの非同期処理
   - ジョブキュー (pg-boss or Supabase Queue)

3. **共有機能**
   - リンク共有 (閲覧専用)
   - 埋め込み (iframe)

4. **URL取り込み**
   - Webページ要約 → Marp生成

5. **課金 (Stripe)**
   - 無料枠超過時の有料プラン

---

## トラブルシューティング

### ビルドエラー: Prisma Client not found
```bash
npx prisma generate
```

### データベース接続エラー
- `.env.local` の `DATABASE_URL` を確認
- Supabase プロジェクトが起動しているか確認

### OAuth エラー
- Callback URL が正しいか確認
- Client ID/Secret が正しいか確認

### LLM API エラー
- `OPENAI_API_KEY` が有効か確認
- gpt-5-mini が利用可能か確認 (APIプランによる)

---

## 技術スタック

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes (Edge + Node.js)
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js (Google/GitHub OAuth)
- **LLM**: OpenAI gpt-5-mini (Responses API)
- **Preview**: @marp-team/marp-core
- **Deploy**: Vercel

---

## ディレクトリ構造

```
wemarp_ai_v1.1/
├── app/
│   ├── page.tsx                    # ホーム
│   ├── login/page.tsx              # ログイン
│   ├── dashboard/page.tsx          # ダッシュボード
│   ├── new/page.tsx                # 新規作成
│   ├── editor/[id]/
│   │   ├── page.tsx                # エディタ (Server)
│   │   └── editor-client.tsx      # エディタ (Client)
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth
│       ├── generate/route.ts       # LLM生成
│       ├── export/route.ts         # エクスポートジョブ
│       └── projects/[id]/versions/ # バージョン保存
├── lib/
│   ├── auth.ts                     # NextAuth設定
│   ├── env.ts                      # 環境変数
│   ├── llm/                        # LLMクライアント
│   ├── prisma.ts                   # Prismaクライアント
│   ├── supabase.ts                 # Supabaseクライアント
│   └── prompts/
│       └── marp-generator.ts      # Marp生成プロンプト
├── supabase/
│   └── migrations/                 # DBマイグレーション
├── prisma/
│   └── schema.prisma               # Prismaスキーマ
└── README_SETUP.md                 # このファイル
```
