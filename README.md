# docker起動後OCWebディレクトリで以下を実行
docker-compose up -d --build

# コンテナが起動しているか確認
docker-compose ps

# ログを確認（エラーがないか）
docker-compose logs -f

# コンテナを起動
docker-compose up -d

# コンテナを停止
docker-compose down
