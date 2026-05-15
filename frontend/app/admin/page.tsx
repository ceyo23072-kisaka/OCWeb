"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api';

interface Slot {
  id: number;
  start_time: string;
  is_booked: boolean;
  user_name?: string | null;
  user_type?: string | null;
  num_people?: number | null;
}

export default function AdminPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cancellingSlotId, setCancellingSlotId] = useState<number | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiBaseUrl()}/slots`);
      setSlots(response.data);
    } catch (error) {
      console.error('管理者用データ取得エラー:', error);
      setMessage('予約状況の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const response = await axios.post(`${getApiBaseUrl()}/admin/login`, {
        password: adminPassword,
      });
      const token = response.data.token;
      localStorage.setItem('adminToken', token);
      setAdminToken(token);
      setIsLoggedIn(true);
      setAdminPassword('');
      setMessage('管理者ログインに成功しました');
    } catch (error) {
      console.error('管理者ログインエラー:', error);
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.detail || '管理者ログインに失敗しました');
      } else {
        setMessage('管理者ログインに失敗しました');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setIsLoggedIn(false);
    setMessage('ログアウトしました');
  };

  const handleAdminCancel = async (slotId: number) => {
    if (!adminToken) {
      setMessage('先に管理者ログインしてください');
      return;
    }

    try {
      setCancellingSlotId(slotId);
      const response = await axios.post(
        `${getApiBaseUrl()}/admin/cancel`,
        { slot_id: slotId },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setMessage(response.data.message);
      fetchSlots();
    } catch (error) {
      console.error('管理者キャンセルエラー:', error);
      setMessage('管理者キャンセルに失敗しました');
    } finally {
      setCancellingSlotId(null);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (token) {
      setAdminToken(token);
      setIsLoggedIn(true);
    }
    fetchSlots();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">管理者ダッシュボード</h1>
            <p className="text-slate-600 mt-2">予約状況の確認とパスワード無視の予約取消ができます。</p>
          </div>
          <a href="/" className="text-sm text-blue-700 hover:text-blue-900 underline">予約ページへ戻る</a>
        </header>

        {message && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            {message}
          </div>
        )}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!isLoggedIn ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">管理者ログイン</h2>
                <p className="mt-2 text-slate-600">管理者パスワードを入力して、予約取消機能を有効にします。</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500"
                  placeholder="管理者パスワード"
                />
                <button
                  onClick={handleLogin}
                  disabled={loginLoading || !adminPassword}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loginLoading ? 'ログイン中...' : 'ログイン'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">管理者ログイン中</h2>
                <p className="mt-2 text-slate-600">管理者権限で予約取消が可能です。</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-200"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">全予約枠: {slots.length}</div>
          <button
            onClick={fetchSlots}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            更新する
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3">時間</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3">区分</th>
                <th className="px-4 py-3">人数</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    読み込み中...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    予約枠がありません。
                  </td>
                </tr>
              ) : (
                slots.map((slot) => (
                  <tr key={slot.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 font-medium">{slot.start_time}</td>
                    <td className="px-4 py-4">
                      {slot.is_booked ? <span className="text-red-600">予約済み</span> : <span className="text-green-600">空き</span>}
                    </td>
                    <td className="px-4 py-4">{slot.is_booked ? slot.user_name ?? '不明' : '—'}</td>
                    <td className="px-4 py-4">{slot.is_booked ? slot.user_type ?? '不明' : '—'}</td>
                    <td className="px-4 py-4">{slot.is_booked && slot.num_people != null ? `${slot.num_people}人` : '—'}</td>
                    <td className="px-4 py-4">
                      {slot.is_booked ? (
                        <button
                          onClick={() => handleAdminCancel(slot.id)}
                          disabled={cancellingSlotId === slot.id || !isLoggedIn}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {cancellingSlotId === slot.id ? '取消中...' : isLoggedIn ? '管理者取消' : 'ログインが必要'}
                        </button>
                      ) : (
                        <span className="text-slate-400">操作不可</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
