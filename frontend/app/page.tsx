"use client";

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';

interface Slot {
  id: number;
  start_time: string;
  is_booked: boolean;
  user_name?: string | null;
  user_type?: string | null;
}

interface HourSummary {
  hour: string;
  total: number;
  booked: number;
  status: '空きあり' | '混雑' | '満席';
}

const getHourFromTime = (time: string) => {
  const match = time.match(/^(\d{1,2})/);
  return match ? match[1].padStart(2, '0') : time;
};

const getStatusLabel = (booked: number, total: number): HourSummary['status'] => {
  if (booked === 0) return '空きあり';
  if (booked >= total) return '満席';
  if (booked / total >= 0.7) return '混雑';
  return '空きあり';
};

export default function HomePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const summary = useMemo<HourSummary[]>(() => {
    const grouped: Record<string, Slot[]> = {};
    slots.forEach((slot) => {
      const hour = getHourFromTime(slot.start_time);
      grouped[hour] = grouped[hour] || [];
      grouped[hour].push(slot);
    });

    return Object.entries(grouped)
      .map(([hour, hourSlots]) => {
        const booked = hourSlots.filter((slot) => slot.is_booked).length;
        return {
          hour,
          total: hourSlots.length,
          booked,
          status: getStatusLabel(booked, hourSlots.length),
        };
      })
      .sort((a, b) => Number(a.hour) - Number(b.hour));
  }, [slots]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiBaseUrl()}/slots`);
      setSlots(response.data);
    } catch (error) {
      console.error('データの取得に失敗しました', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSlots = async () => {
      await fetchSlots();
    };
    void loadSlots();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">オープンキャンパス予約</h1>
            <p className="mt-3 text-slate-600">1時間ごとの混雑状況を確認し、詳細な10分刻み枠の予約ページに進みます。</p>
          </div>
          <button
            onClick={fetchSlots}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
          >
            更新する
          </button>
        </header>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">読み込み中...</div>
          ) : summary.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">予約枠がありません。</div>
          ) : (
            summary.map((item) => (
              <div key={item.hour} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{item.hour}時台</div>
                    <div className="mt-2 text-sm text-slate-500">{item.booked}/{item.total} 予約済み</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === '満席'
                        ? 'bg-red-100 text-red-700'
                        : item.status === '混雑'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">10分ごとの枠を確認</div>
                  <Link
                    href={`/hour/${item.hour}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    詳細へ
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
