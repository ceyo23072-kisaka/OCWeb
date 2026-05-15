export const getApiBaseUrl = (): string => {
  // Vercel環境変数がある場合
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // ローカル開発用
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  // 本番(Render)
  return 'https://ocweb-j6t0.onrender.com';
};