FROM node:20-alpine

WORKDIR /app

# 依存関係のインストール
COPY package.json package-lock.json ./
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# Next.jsサーバーを起動（開発用ホットリロード対応）
CMD ["npm", "run", "dev"]

