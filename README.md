# SessionHub

**SessionHub** は、Webブラウザ上で動作するリアルタイムTRPGオンラインセッションツールです。
Svelte 5 (Runes) と Socket.IO を使用し、軽量かつ高速な同期処理を実現しています。また、著作権やプライバシーに配慮し、アップロードされた画像アセットはサーバー上で暗号化して保存される仕組みを備えています。

## 🚀 主な機能 (Features)

* **リアルタイム同期**: Socket.IO により、キャラクターコマの移動や追加が参加者全員の画面に即座に反映されます。
* **直感的な操作**:
    * ドラッグ＆ドロップによるコマの移動。
    * ローカル画像をドラッグ＆ドロップしてアップロード・即時反映。
    * 右クリックメニューによるコンテキスト操作。
* **画像アセット管理**:
    * **自動軽量化**: アップロードされた画像はサーバー側で自動的に `WebP` 形式に変換・軽量化されます。
    * **セキュアな保存**: 画像ファイルはサーバー上で **AES-256-CBC** アルゴリズムを用いて暗号化されて保存されます。管理者であっても直接画像を閲覧することはできません。
* **ルーム機能**: URLベースのルーム分けに対応（例: `/room/my-session`）。

## 🛠️ 技術スタック (Tech Stack)

### Frontend (`/client`)
* **Framework**: [Svelte 5](https://svelte.dev/) (Runes syntax)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Language**: TypeScript
* **Communication**: Socket.IO Client

### Backend (`/server`)
* **Runtime**: Node.js
* **Framework**: Express
* **Real-time Engine**: Socket.IO
* **Image Processing**: [sharp](https://sharp.pixelplumbing.com/) (WebP conversion)
* **File Upload**: Multer
* **Security**: Node.js Crypto (AES-256-CBC Encryption)

## 📦 インストールと起動 (Installation & Setup)
このリポジトリにはクライアントとサーバーが含まれています。それぞれ別のターミナルで起動する必要があります。

### 前提条件
* Node.js (v18以上推奨)
* npm

### 1. リポジトリのクローン
```bash
git clone [https://github.com/shionyan/SessionHub.git](https://github.com/shionyan/SessionHub.git)
cd SessionHub
```

### 2. サーバーのセットアップと起動
```bash
cd server
npm install

# サーバーを起動 (ポート3000で待機)
node index.js
```

### 3. クライアントのセットアップと起動
別のターミナルを開き、ルートディレクトリから以下を実行します。
```bash
cd client
npm install

# 開発サーバーを起動
npm run dev
```
ブラウザで http://localhost:5173 にアクセスするとアプリが使用できます。 特定の部屋に入る場合は http://localhost:5173/room/任意のルームID にアクセスしてください。

## 🚧 今後のロードマップ (Roadmap)
* **アセット管理の強化**:
 * キャラクター（立ち絵・アイコン）とパネル（背景・マップ）の種別管理。
 * タグ付け機能の実装。
 * ユーザーごとのマイライブラリ機能。

* **ベクターオブジェクト対応**:
 * 図形、文字、テンプレートの保存と描画。

* **セキュリティと認証**:
 * 暗号化された画像の復号・閲覧権限の制御（現在はアップロードのみ実装済）。
 * ユーザー認証システム。

* **グリッドシステム**:
 * マス目へのスナップ機能。

## 📂 ディレクトリ構成
SessionHub/
├── client/          # フロントエンド (Svelte + Vite)
│   ├── src/
│   │   ├── lib/     # コンポーネント (Tabletop, Modal等)
│   │   └── ...
│   └── ...
├── server/          # バックエンド (Express + Socket.IO)
│   ├── uploads/     # 暗号化された画像データの保存先
│   ├── index.js     # サーバーエントリーポイント
│   └── ...
└── ...

## 📄 ライセンス
このソフトウェアは MIT License の下で公開されています。
***
Copyright (c) 2025 shionyan