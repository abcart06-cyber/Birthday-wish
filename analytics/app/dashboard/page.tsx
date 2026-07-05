'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  Globe,
  Compass,
  Monitor,
  Calendar,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface KPIState {
  pageViews: number;
  visitors: number;
  sessions: number;
  bounceRate: number;
  liveVisitors: number;
}

interface TimelineItem {
  date: string;
  views: number;
  visitors: number;
}

interface PageItem {
  path: string;
  title: string;
  views: number;
  avgDuration: number;
  avgScrollDepth: number;
}

interface ReferrerItem {
  referrer: string;
  count: number;
}

interface CountryItem {
  country: string;
  count: number;
}

interface BrowserItem {
  browser: string;
  count: number;
}

interface DeviceItem {
  device: string;
  count: number;
}

interface OSItem {
  os: string;
  count: number;
}

interface UTMCampaignItem {
  campaign: string;
  count: number;
}

interface StatsData {
  kpis: KPIState;
  topPages: PageItem[];
  topReferrers: ReferrerItem[];
  topCountries: CountryItem[];
  topBrowsers: BrowserItem[];
  topDevices: DeviceItem[];
  topOS: OSItem[];
  topUTMCampaigns: UTMCampaignItem[];
  timeline: TimelineItem[];
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('7d');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Helper to calculate date strings for backend fetch
  const getDateParams = (range: string) => {
    const end = new Date();
    const start = new Date();
    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (range === '7d') {
      start.setDate(start.getDate() - 7);
    } else if (range === '30d') {
      start.setDate(start.getDate() - 30);
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const fetchStats = async (range: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { startDate, endDate } = getDateParams(range);
      const res = await fetch(`/api/stats?startDate=${startDate}&endDate=${endDate}`);
      const stats = await res.json();
      setData(stats);
    } catch (error) {
      console.error('Failed fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStats(dateRange);

    // Polling interval: silently refresh every 15 seconds to keep Live Count updated
    const timer = setInterval(() => {
      fetchStats(dateRange, true);
    }, 15000);

    return () => clearInterval(timer);
  }, [dateRange]);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── HEADER SECTION ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-teal-500/10 pb-6">
        <div>
          <h1 className="font-sans text-3xl font-800 text-charcoal-800 tracking-tight flex items-center gap-2">
            <span>Website Analytics</span>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500/10">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            </span>
          </h1>
          <p className="text-sm text-charcoal-700/60 mt-1 font-sans">
            Realtime performance metrics and user behavior logging.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Refresh indicator */}
          {refreshing && (
            <span className="text-xs text-teal-600/70 flex items-center gap-1 font-sans animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" /> Updating...
            </span>
          )}

          {/* Date Range Selector */}
          <div className="relative inline-block w-full sm:w-44">
            <select
              value={dateRange}
              onChange={(e: any) => setDateRange(e.target.value)}
              className="w-full bg-white/70 backdrop-blur-md border border-teal-500/10 rounded-xl px-4 py-2.5 text-sm text-charcoal-800 font-sans font-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 shadow-sm cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </header>

      {/* ── KPI METRICS CARDS ── */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Unique Visitors */}
        <div className="bg-white/75 backdrop-blur-md border border-white/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-600 uppercase tracking-wider text-charcoal-700/50">Unique Visitors</span>
            <span className="p-2 bg-teal-500/5 text-teal-600 rounded-xl"><Users className="h-4 w-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-800 text-charcoal-800">
              {loading ? '...' : data?.kpis.visitors.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Total Pageviews */}
        <div className="bg-white/75 backdrop-blur-md border border-white/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-600 uppercase tracking-wider text-charcoal-700/50">Page Views</span>
            <span className="p-2 bg-teal-500/5 text-teal-600 rounded-xl"><Eye className="h-4 w-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-800 text-charcoal-800">
              {loading ? '...' : data?.kpis.pageViews.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Avg Time on Page */}
        <div className="bg-white/75 backdrop-blur-md border border-white/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-600 uppercase tracking-wider text-charcoal-700/50">Avg Page Time</span>
            <span className="p-2 bg-teal-500/5 text-teal-600 rounded-xl"><Clock className="h-4 w-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-800 text-charcoal-800">
              {loading ? '...' : formatDuration(Math.round(data?.topPages[0]?.avgDuration || 0))}
            </span>
          </div>
        </div>

        {/* Bounce Rate */}
        <div className="bg-white/75 backdrop-blur-md border border-white/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-600 uppercase tracking-wider text-charcoal-700/50">Bounce Rate</span>
            <span className="p-2 bg-teal-500/5 text-teal-600 rounded-xl"><TrendingUp className="h-4 w-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-800 text-charcoal-800 font-sans">
              {loading ? '...' : `${data?.kpis.bounceRate || 0}%`}
            </span>
          </div>
        </div>

        {/* Live Active Visitors */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-teal-500 to-teal-600 p-5 rounded-2xl shadow-md flex flex-col justify-between text-white hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-600 uppercase tracking-widest text-teal-100/70">Live Visitors</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse"></span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-900 tracking-tight block">
              {loading ? '...' : data?.kpis.liveVisitors || 0}
            </span>
            <span className="text-[10px] text-teal-100/70 uppercase tracking-wider font-500 mt-1 block">Active in past 5 min</span>
          </div>
        </div>
      </section>

      {/* ── TIMELINE GRAPH ── */}
      <section className="bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-700 text-charcoal-800 mb-6 font-sans">Views & Visitors Over Time</h2>
        <div className="h-72 sm:h-96 w-full">
          {loading ? (
            <div className="w-full h-full bg-charcoal-100/30 animate-pulse rounded-2xl flex items-center justify-center text-charcoal-700/30 text-sm">
              Loading analytics chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5BADA6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5BADA6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2C94C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F2C94C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#3D3D3D80', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#3D3D3D80', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    border: '1px solid rgba(91, 173, 166, 0.15)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#2A2A2A', marginBottom: '4px' }}
                />
                <Area
                  name="Page Views"
                  type="monotone"
                  dataKey="views"
                  stroke="#5BADA6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
                <Area
                  name="Unique Visitors"
                  type="monotone"
                  dataKey="visitors"
                  stroke="#F2C94C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── TOP PAGES & REFERRERS SPLIT ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-700 text-charcoal-800 mb-5 font-sans">Top Visited Pages</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead>
                  <tr className="border-b border-teal-500/5 text-charcoal-700/40 text-xs font-600 uppercase tracking-wider">
                    <th className="pb-3">Path</th>
                    <th className="pb-3 text-right">Views</th>
                    <th className="pb-3 text-right">Avg Time</th>
                    <th className="pb-3 text-right">Avg Scroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-500/5 font-500 text-charcoal-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-charcoal-700/30">Loading pages...</td>
                    </tr>
                  ) : data?.topPages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-charcoal-700/30">No pageviews recorded in this range</td>
                    </tr>
                  ) : (
                    data?.topPages.map((page, idx) => (
                      <tr key={idx} className="hover:bg-teal-500/5 transition-colors">
                        <td className="py-3.5 pr-4 truncate max-w-xs font-mono text-xs text-teal-600">
                          {page.path}
                          <span className="text-[10px] text-charcoal-700/40 block mt-0.5 font-sans not-italic">
                            {page.title}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-semibold">{page.views}</td>
                        <td className="py-3.5 text-right">{formatDuration(page.avgDuration)}</td>
                        <td className="py-3.5 text-right">{page.avgScrollDepth}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Referrers List (1/3 width) */}
        <div className="bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-700 text-charcoal-800 mb-5 font-sans">Traffic Referrers</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10 font-sans">Loading referrers...</p>
            ) : data?.topReferrers.length === 0 ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10 font-sans">No referrer logs found</p>
            ) : (
              data?.topReferrers.map((ref, idx) => {
                const maxCount = data.topReferrers[0]?.count || 1;
                const percentage = Math.round((ref.count / maxCount) * 100);
                return (
                  <div key={idx} className="relative flex flex-col font-sans">
                    <div className="flex justify-between items-center text-sm font-500 text-charcoal-800 z-10">
                      <span className="truncate max-w-[200px] text-xs font-semibold">{ref.referrer}</span>
                      <span className="text-xs font-semibold">{ref.count}</span>
                    </div>
                    {/* Relative horizontal bars */}
                    <div className="w-full bg-teal-500/5 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── DEMOGRAPHICS SPLIT ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Countries & Cities */}
        <div className="bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-700 text-charcoal-800 mb-5 font-sans flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal-600" /> Geography
          </h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10">Loading countries...</p>
            ) : data?.topCountries.length === 0 ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10">No geographical logs</p>
            ) : (
              data?.topCountries.map((c, idx) => {
                const max = data.topCountries[0]?.count || 1;
                const percent = Math.round((c.count / max) * 100);
                return (
                  <div key={idx} className="relative flex flex-col font-sans">
                    <div className="flex justify-between items-center text-xs font-600 text-charcoal-800">
                      <span>{c.country}</span>
                      <span>{c.count}</span>
                    </div>
                    <div className="w-full bg-teal-500/5 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Browsers & System */}
        <div className="bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-700 text-charcoal-800 mb-5 font-sans flex items-center gap-2">
            <Compass className="h-4 w-4 text-teal-600" /> Browsers
          </h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10">Loading browsers...</p>
            ) : data?.topBrowsers.length === 0 ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10">No browser logs</p>
            ) : (
              data?.topBrowsers.map((b, idx) => {
                const max = data.topBrowsers[0]?.count || 1;
                const percent = Math.round((b.count / max) * 100);
                return (
                  <div key={idx} className="relative flex flex-col font-sans">
                    <div className="flex justify-between items-center text-xs font-600 text-charcoal-800">
                      <span className="truncate max-w-[200px]">{b.browser}</span>
                      <span>{b.count}</span>
                    </div>
                    <div className="w-full bg-teal-500/5 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-teal-500/70 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Devices & OS */}
        <div className="bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-700 text-charcoal-800 mb-5 font-sans flex items-center gap-2">
            <Monitor className="h-4 w-4 text-teal-600" /> Devices &amp; OS
          </h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-charcoal-700/30 text-center py-10">Loading device metrics...</p>
            ) : (
              <>
                <div className="pb-3 border-b border-teal-500/5">
                  <h3 className="text-xs font-700 text-charcoal-700/40 uppercase tracking-wider mb-2">Device Form Factors</h3>
                  <div className="space-y-3">
                    {data?.topDevices.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-600 text-charcoal-800 font-sans">
                        <span className="capitalize">{d.device}</span>
                        <span>{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xs font-700 text-charcoal-700/40 uppercase tracking-wider mb-2">Operating Systems</h3>
                  <div className="space-y-3">
                    {data?.topOS.map((o, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-600 text-charcoal-800 font-sans">
                        <span>{o.os}</span>
                        <span>{o.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── CAMPAIGNS SPLIT ── */}
      <section className="bg-white/70 backdrop-blur-md border border-white/55 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-700 text-charcoal-800 mb-5 font-sans">UTM Campaigns (Acquisition)</h2>
        {loading ? (
          <p className="text-sm text-charcoal-700/30 text-center py-10 font-sans">Loading campaign data...</p>
        ) : data?.topUTMCampaigns.length === 0 ? (
          <p className="text-sm text-charcoal-700/35 text-center py-8 font-sans">No custom UTM campaigns logged in this date range.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.topUTMCampaigns.map((utm, idx) => (
              <div key={idx} className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10">
                <span className="text-[10px] text-charcoal-700/40 uppercase font-600 tracking-wider">Campaign Name</span>
                <p className="font-mono text-sm font-semibold text-teal-700 mt-1 truncate">{utm.campaign}</p>
                <div className="mt-3 flex justify-between items-baseline">
                  <span className="text-2xl font-800 text-charcoal-800">{utm.count}</span>
                  <span className="text-[10px] text-charcoal-700/40 font-500">clicks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
