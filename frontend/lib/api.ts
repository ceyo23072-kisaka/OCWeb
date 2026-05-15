// API ベースURL の取得
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined') {
    // ブラウザでは Docker コンテナのホスト名（backend）を解決できないため、
    // ホストマシンの URL を使うようにします。
    if (!envUrl || envUrl.includes('backend')) {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return envUrl;
  }

  return envUrl || 'http://localhost:8000';
};
