// API ベースURL の取得
export const getApiBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://ocweb-j6t0.onrender.com'
  );
};