// API ベースURL の取得
export const getApiBaseUrl = (): string => {
  // クライアント側 (ブラウザ)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // サーバー側
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};
