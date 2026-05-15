
// API ベースURL の取得
export const getApiBaseUrl = (): string => {
  // 環境変数が設定されている場合はそれを使用
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  // ローカル開発環境
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  // 本番(Render)
  return 'https://ocweb-j6t0.onrender.com';
};
