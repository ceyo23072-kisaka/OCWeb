// API ベースURL の取得
export const getApiBaseUrl = (): string => {
  // 環境変数が設定されている場合はそれを使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 開発環境では localhost を使用
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  // 本番環境では Render の URL を使用
  return 'https://ocweb-j6t0.onrender.com';
};