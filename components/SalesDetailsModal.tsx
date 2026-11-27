"use client";

import { useMemo, useState } from "react";
import ModalButton from "@/components/ModalButton";
import StarRating from "@/components/StarRating";
import { formatDate, formatPrice } from "@/lib/labels";
import {
    buildSalesReport,
    lastDays,
    monthToDate,
    todayKey,
    type FlatOrder,
} from "@/lib/analytics";
import type { RatingsReport } from "@/lib/reviews";

const W = 900;
const H = 240;
const PAD_L = 48;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 30;

export type Tab = "overview" | "dishes" | "time" | "ratings";

const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Обзор" },
    { id: "dishes", label: "Блюда" },
    { id: "time", label: "Время и оплата" },
    { id: "ratings", label: "Оценки" },
];

function niceMax(v: number) {
    if (v <= 0) return 1000;
    const pow = 10 ** Math.floor(Math.log10(v));
    const n = v / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
}

function shortMoney(v: number) {
    return v >= 1000 ? `${Math.round(v / 100) / 10}к` : String(v);
}

const fmt = (key: string) => key.split("-").reverse().join(".");

export function SalesDetails({
  orders,
  ratings,
  initialTab = "overview",
}: {
  orders: FlatOrder[];
  ratings: RatingsReport;
  initialTab?: Tab;
}) {
    const start = lastDays(7);
    const [from, setFrom] = useState(start.from);
    const [to, setTo] = useState(start.to);
    const [hover, setHover] = useState<number | null>(null);
    const [tab, setTab] = useState<Tab>(initialTab);
    const today = todayKey();

    const presets = [
        { label: "7 дней", ...lastDays(7) },
        { label: "30 дней", ...lastDays(30) },
        { label: "90 дней", ...lastDays(90) },
        { label: "С начала месяца", ...monthToDate() },
    ];

    function applyRange(f: string, t: string) {
        setFrom(f);
        setTo(t);
        setHover(null);
    }

    const r = useMemo(() => buildSalesReport(orders, from, to), [orders, from, to]);
    const n = r.series.length;
    const yMax = niceMax(Math.max(0, ...r.series.map((d) => d.revenue)));
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const yOf = (v: number) => PAD_T + (1 - v / yMax) * innerH;
    const xOf = (i: number) => (n === 1 ? PAD_L + innerW / 2 : PAD_L + (i * innerW) / (n - 1));

    const pts = r.series.map((d, i) => ({ x: xOf(i), y: yOf(d.revenue) }));
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${pts[n - 1].x},${H - PAD_B} L${pts[0].x},${H - PAD_B} Z`;
    const ticks = [0, 1, 2, 3, 4].map((k) => (yMax * k) / 4);
    const labelStep = Math.ceil(n / 10);
    const colW = n === 1 ? innerW : innerW / (n - 1);
    const showDots = n <= 45;

    const delta = r.prevRevenue > 0 ? Math.round(((r.revenue - r.prevRevenue) / r.prevRevenue) * 100) : null;
    const point = hover !== null ? (r.series[hover] ?? null) : null;

    const maxDish = Math.max(1, ...r.topDishes.map((d) => d.revenue));
    const maxHour = Math.max(1, ...r.byHour);
    const totalPayOrders = Math.max(1, r.byPayment.reduce((sum, p) => sum + p.orders, 0));
    const maxStar = Math.max(1, ...ratings.distribution.map((d) => d.count));
    const hasRatings = ratings.dishCount + ratings.deliveryCount > 0;

    return (
        <div className="sales-details">
            <div className="sales-controls">
                <div className="period-switch">
                    {presets.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            className={r.from === p.from && r.to === p.to ? "size-btn active" : "size-btn"}
                            onClick={() => applyRange(p.from, p.to)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="range-row">
                    <label className="range-field">
                        С
                        <input
                            type="date"
                            className="input"
                            value={from}
                            max={to}
                            onChange={(e) => e.target.value && applyRange(e.target.value, to)}
                        />
                    </label>
                    <label className="range-field">
                        По
                        <input
                            type="date"
                            className="input"
                            value={to}
                            min={from}
                            max={today}
                            onChange={(e) => e.target.value && applyRange(from, e.target.value)}
                        />
                    </label>
                    <span className="muted small">
            {fmt(r.from)} — {fmt(r.to)} · дней: {r.days}
          </span>
                </div>
            </div>

            <div className="tabs" role="tablist">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        className={tab === t.id ? "tab active" : "tab"}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="sales-tab">
                {tab === "overview" && (
                    <>
                        <div className="sales-kpis">
                            <div className="card stat">
                                <div className="muted small">Выручка</div>
                                <div className="value">{formatPrice(r.revenue)}</div>
                                {delta !== null && (
                                    <span className={`badge ${delta >= 0 ? "badge-green" : "badge-red"}`}>
                    {delta >= 0 ? "+" : ""}
                                        {delta}% к прошлому периоду
                  </span>
                                )}
                            </div>
                            <div className="card stat">
                                <div className="muted small">Заказов</div>
                                <div className="value">{r.orders}</div>
                                <div className="muted small">Отменено: {r.cancelled}</div>
                            </div>
                            <div className="card stat">
                                <div className="muted small">Средний чек</div>
                                <div className="value">{formatPrice(r.avgCheck)}</div>
                            </div>
                        </div>

                        <div className="sales-readout">
                            {point ? (
                                <>
                                    <strong>{point.full}</strong>
                                    <span>
                    {formatPrice(point.revenue)} · заказов: {point.orders}
                  </span>
                                </>
                            ) : (
                                <span className="muted">Наведите на точку графика, чтобы увидеть день</span>
                            )}
                        </div>

                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            className="sales-svg"
                            role="img"
                            aria-label="График выручки по дням"
                            onMouseLeave={() => setHover(null)}
                        >
                            <defs>
                                <linearGradient id="sales-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" style={{ stopColor: "var(--brand)", stopOpacity: 0.35 }} />
                                    <stop offset="100%" style={{ stopColor: "var(--brand)", stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>

                            {ticks.map((t) => (
                                <g key={t}>
                                    <line x1={PAD_L} x2={W - PAD_R} y1={yOf(t)} y2={yOf(t)} className="grid-line" />
                                    <text x={PAD_L - 8} y={yOf(t) + 4} textAnchor="end" className="axis-text">
                                        {shortMoney(t)}
                                    </text>
                                </g>
                            ))}

                            <path d={area} fill="url(#sales-grad)" />
                            <path d={line} className="sales-line" />

                            {hover !== null && pts[hover] && (
                                <line x1={pts[hover].x} x2={pts[hover].x} y1={PAD_T} y2={H - PAD_B} className="hover-line" />
                            )}

                            {pts.map((p, i) =>
                                showDots || hover === i ? (
                                    <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 6 : 3.5} className="sales-dot" />
                                ) : null,
                            )}

                            {r.series.map((d, i) =>
                                i % labelStep === 0 ? (
                                    <text key={d.key} x={pts[i].x} y={H - 8} textAnchor="middle" className="axis-text">
                                        {d.label}
                                    </text>
                                ) : null,
                            )}

                            {pts.map((p, i) => (
                                <rect
                                    key={i}
                                    x={p.x - colW / 2}
                                    y={PAD_T}
                                    width={colW}
                                    height={innerH}
                                    fill="transparent"
                                    onMouseEnter={() => setHover(i)}
                                    onClick={() => setHover(i)}
                                />
                            ))}
                        </svg>
                    </>
                )}

                {tab === "dishes" && (
                    <section>
                        <h3>Топ блюд по выручке</h3>
                        {r.topDishes.length === 0 && <p className="muted small">Пока нет продаж за период</p>}
                        {r.topDishes.map((d, i) => (
                            <div key={d.name} className="rank-row">
                                <div className="row-between">
                                    <strong>
                                        {i + 1}. {d.name}
                                    </strong>
                                    <span className="small muted">
                    {d.qty} шт. · {formatPrice(d.revenue)}
                  </span>
                                </div>
                                <div className="rank-track">
                                    <div className="rank-fill" style={{ width: `${(d.revenue / maxDish) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {tab === "time" && (
                    <div className="sales-columns">
                        <section>
                            <h3>Заказы по часам</h3>
                            <div className="hours hours-tall" aria-label="Распределение заказов по часам">
                                {r.byHour.map((c, h) => (
                                    <div
                                        key={h}
                                        className="hour-bar"
                                        title={`${h}:00 — заказов: ${c}`}
                                        style={{ height: `${(c / maxHour) * 100}%`, minHeight: c ? 5 : 2 }}
                                    />
                                ))}
                            </div>
                            <div className="hours-axis">
                                <span>0</span>
                                <span>6</span>
                                <span>12</span>
                                <span>18</span>
                                <span>23</span>
                            </div>
                        </section>

                        <section>
                            <h3>Оплата</h3>
                            {r.byPayment.length === 0 && <p className="muted small">Пока нет данных</p>}
                            {r.byPayment.map((p) => (
                                <div key={p.method} className="rank-row">
                                    <div className="row-between">
                                        <strong>{p.method}</strong>
                                        <span className="small muted">
                      {p.orders} зак. · {formatPrice(p.revenue)}
                    </span>
                                    </div>
                                    <div className="rank-track">
                                        <div className="rank-fill" style={{ width: `${(p.orders / totalPayOrders) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                )}

                {tab === "ratings" && (
                    <>
                        <p className="muted small">Оценки клиентов за всё время (период выше на них не влияет).</p>
                        {!hasRatings && <div className="card muted">Оценок пока нет. Они появятся, когда клиенты оценят доставленные заказы.</div>}
                        {hasRatings && (
                            <>
                                <div className="sales-kpis">
                                    <div className="card stat">
                                        <div className="muted small">Блюда</div>
                                        <div className="value icon-row">
                                            {ratings.dishCount ? ratings.dishAvg.toFixed(1) : "—"}
                                            {ratings.dishCount > 0 && <StarRating value={ratings.dishAvg} size={18} />}
                                        </div>
                                        <div className="muted small">Оценок: {ratings.dishCount}</div>
                                    </div>
                                    <div className="card stat">
                                        <div className="muted small">Доставка</div>
                                        <div className="value icon-row">
                                            {ratings.deliveryCount ? ratings.deliveryAvg.toFixed(1) : "—"}
                                            {ratings.deliveryCount > 0 && <StarRating value={ratings.deliveryAvg} size={18} />}
                                        </div>
                                        <div className="muted small">Оценок: {ratings.deliveryCount}</div>
                                    </div>
                                </div>

                                <div className="sales-columns">
                                    <section>
                                        <h3>Оценки блюд по звёздам</h3>
                                        {ratings.distribution.map((d) => (
                                            <div key={d.star} className="rank-row">
                                                <div className="row-between">
                                                    <strong>{d.star} ★</strong>
                                                    <span className="small muted">{d.count}</span>
                                                </div>
                                                <div className="rank-track">
                                                    <div className="rank-fill" style={{ width: `${(d.count / maxStar) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}

                                        <h3 style={{ marginTop: 16 }}>Лучшие блюда</h3>
                                        {ratings.topDishes.map((d) => (
                                            <div key={d.name} className="row-between" style={{ marginBottom: 6 }}>
                                                <strong>{d.name}</strong>
                                                <span className="icon-row small">
                          <StarRating value={d.avg} size={14} />
                                                    {d.avg.toFixed(1)} ({d.count})
                        </span>
                                            </div>
                                        ))}
                                    </section>

                                    <section>
                                        <h3>Курьеры</h3>
                                        {ratings.couriers.length === 0 && <p className="muted small">Оценок доставки пока нет</p>}
                                        {ratings.couriers.map((c) => (
                                            <div key={c.name} className="row-between" style={{ marginBottom: 6 }}>
                                                <strong>{c.name}</strong>
                                                <span className="icon-row small">
                          <StarRating value={c.avg} size={14} />
                                                    {c.avg.toFixed(1)} ({c.count})
                        </span>
                                            </div>
                                        ))}

                                        <h3 style={{ marginTop: 16 }}>Последние отзывы</h3>
                                        {ratings.latest.length === 0 && <p className="muted small">Комментариев пока нет</p>}
                                        <ul className="review-list">
                                            {ratings.latest.map((x) => (
                                                <li key={x.orderId} className="review-item">
                                                    <div className="row-between">
                                                        <span className="small muted">{x.dishes}</span>
                                                        <span className="small muted">{formatDate(x.createdAt)}</span>
                                                    </div>
                                                    <p>{x.comment}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function SalesDetailsModal({
                                              orders,
                                              ratings,
                                          }: {
    orders: FlatOrder[];
    ratings: RatingsReport;
}) {
    return (
        <ModalButton label="Подробнее" title="Аналитика продаж" className="btn btn-primary btn-sm">
            <SalesDetails orders={orders} ratings={ratings} />
        </ModalButton>
    );
}