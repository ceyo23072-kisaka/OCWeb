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
}

export default function AdminPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cancellingSlotId, setCancellingSlotId] = useState<number | null>(null);

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

  const handleAdminCancel = async (slotId: number) => {
    try {
      setCancellingSlotId(slotId);
      const response = await axios.post(`${getApiBaseUrl()}/admin/cancel`, {
        slot_id: slotId,
      });
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
                <th className="px-4 py-3">名前 / 区分</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    読み込み中...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
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
                    <td className="px-4 py-4">
                      {slot.is_booked ? `${slot.user_name ?? '不明'} / ${slot.user_type ?? '不明'}` : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {slot.is_booked ? (
                        <button
                          onClick={() => handleAdminCancel(slot.id)}
                          disabled={cancellingSlotId === slot.id}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {cancellingSlotId === slot.id ? '取消中...' : '管理者取消'}
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
