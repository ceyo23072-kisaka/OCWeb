"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api';

interface Slot {
  id: number;
  start_time: string;
  is_booked: boolean;
  user_name?: string | null;
  user_type?: string | null;
}

const getTimeRange = (startTime: string) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + 10 * 60 * 1000); // 10分加算
  const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
  return `${startTime}～${endTime}`;
};

const getHourFromTime = (time: string) => {
  const match = time.match(/^(\d{1,2})/);
  return match ? match[1].padStart(2, '0') : time;
};

export default function HourDetailPage() {
  const params = useParams();
  const hour = params?.hour ?? '';
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('Child');
  const [numPeople, setNumPeople] = useState(1);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiBaseUrl()}/slots`);
      setSlots(response.data);
    } catch (error) {
      console.error('データ取得エラー:', error);
      setMessage('予約状況の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const filteredSlots = useMemo(
    () => slots.filter((slot) => getHourFromTime(slot.start_time) === hour),
    [slots, hour]
  );

  const handleReserve = async () => {
    if (!selectedSlot || !userName) return alert('名前を入力してください');
    if (numPeople < 1 || numPeople > 10) return alert('人数は1～10人で入力してください');

    try {
      const response = await axios.post(`${getApiBaseUrl()}/book`, {
        slot_id: selectedSlot.id,
        user_name: userName,
        user_type: userType,
        num_people: numPeople,
        password,
      });

      if (response.data.success) {
        alert('予約を完了しました！');
        setSelectedSlot(null);
        setUserName('');
        setPassword('');
        fetchSlots();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('予約エラー:', error);
      alert('サーバーとの通信に失敗しました');
    }
  };

  const handleCancel = async () => {
    if (!selectedSlot) return;
    if (!password) return alert('キャンセル用パスワードを入力してください');

    try {
      const response = await axios.post(`${getApiBaseUrl()}/cancel`, {
        slot_id: selectedSlot.id,
        password,
      });

      if (response.data.success) {
        alert('予約をキャンセルしました');
        setSelectedSlot(null);
        setPassword('');
        fetchSlots();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('キャンセルエラー:', error);
      alert('サーバーとの通信に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">{hour}時台の詳細</h1>
            <p className="mt-3 text-slate-600">10分刻みの予約状況を確認して、希望の時間を選んでください。</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchSlots} className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
              更新する
            </button>
            <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 hover:bg-slate-100">
              1時間ごとの一覧へ
            </Link>
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">読み込み中...</div>
        ) : filteredSlots.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
            {hour ? `${hour}時台の10分刻み枠が見つかりませんでした。` : '表示できる時間がありません。'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-3xl border p-5 text-left transition ${
                  slot.is_booked
                    ? 'border-slate-200 bg-slate-100 text-slate-500'
                    : 'border-blue-100 bg-white text-slate-900 hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold">{getTimeRange(slot.start_time)}</div>
                    <div className="mt-2 text-sm text-slate-500">{slot.is_booked ? '予約済み' : '受付中'}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${slot.is_booked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {slot.is_booked ? '満枠' : '空き'}
                  </div>
                </div>
                {slot.is_booked && (
                  <div className="mt-4 text-sm text-slate-500">{slot.user_name ?? '予約済み'} / {slot.user_type ?? '不明'}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{getTimeRange(selectedSlot.start_time)} の予約</h2>

              {!selectedSlot.is_booked ? (
                <>
                  <label className="block mb-4">
                    <span className="text-sm text-slate-600">お名前（学生名）</span>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full mt-2 rounded-2xl border px-4 py-3 text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500"
                      placeholder="山田 太郎"
                    />
                  </label>
                  <label className="block mb-4">
                    <span className="text-sm text-slate-600">予約人数</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={numPeople}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value < 1) {
                          setNumPeople(1);
                        } else if (value > 10) {
                          setNumPeople(10);
                        } else {
                          setNumPeople(value);
                        }
                      }}
                      className="w-full mt-2 rounded-2xl border px-4 py-3 text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500"
                    />
                    <p className="mt-2 text-xs text-slate-500">1～10人までで入力してください。</p>
                  </label>
                  <label className="block mb-4">
                    <span className="text-sm text-slate-600">予約用パスワード</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full mt-2 rounded-2xl border px-4 py-3 text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500"
                      placeholder="キャンセル時に使います"
                    />
                  </label>
                  <div className="mb-6 text-sm text-slate-500">来場者区分</div>
                  <div className="mb-6 flex gap-2">
                    {['Child', 'Parent', 'Both'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setUserType(type)}
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          userType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {type === 'Child' ? '子のみ' : type === 'Parent' ? '親のみ' : '親子'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedSlot(null)} className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700">閉じる</button>
                    <button onClick={handleReserve} className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-white">予約する</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm text-slate-600">キャンセルするには予約時に設定したパスワードを入力してください。</p>
                  <label className="block mb-6">
                    <span className="text-sm text-slate-600">キャンセル用パスワード</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full mt-2 rounded-2xl border px-4 py-3 text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500"
                      placeholder="予約時に設定したパスワード"
                    />
                  </label>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedSlot(null)} className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700">閉じる</button>
                    <button onClick={handleCancel} className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-white">予約をキャンセル</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
