import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    const endDate = endParam ? new Date(endParam) : new Date();
    // Default to last 7 days if not provided
    const startDate = startParam 
      ? new Date(startParam) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. KPI Counts
    const totalPageViews = await prisma.pageView.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const totalSessions = await prisma.session.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const uniqueVisitorsResult = await prisma.session.groupBy({
      by: ['visitorId'],
      where: { createdAt: { gte: startDate, lte: endDate } },
    });
    const uniqueVisitors = uniqueVisitorsResult.length;

    // Bounce Rate: Session has exactly 1 page view
    // Let's query session pageview counts in range
    const sessionsWithViews = await prisma.session.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        _count: {
          select: { pageViews: true },
        },
      },
    });
    const totalSessionCount = sessionsWithViews.length;
    const bouncedSessions = sessionsWithViews.filter(s => s._count.pageViews <= 1).length;
    const bounceRate = totalSessionCount > 0 
      ? Math.round((bouncedSessions / totalSessionCount) * 100) 
      : 0;

    // 2. Live Visitors (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const liveVisitorsResult = await prisma.session.groupBy({
      by: ['visitorId'],
      where: {
        pageViews: {
          some: {
            createdAt: { gte: fiveMinutesAgo },
          },
        },
      },
    });
    const liveVisitors = liveVisitorsResult.length;

    // 3. Top Lists (Aggregates)
    const topPages = await prisma.pageView.groupBy({
      by: ['path', 'title'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _avg: { duration: true, scrollDepth: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topReferrers = await prisma.session.groupBy({
      by: ['referrer'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topCountries = await prisma.session.groupBy({
      by: ['country'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topBrowsers = await prisma.session.groupBy({
      by: ['browser'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topDevices = await prisma.session.groupBy({
      by: ['device'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topOS = await prisma.session.groupBy({
      by: ['os'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topUTMCampaigns = await prisma.session.groupBy({
      by: ['utmCampaign'],
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        utmCampaign: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // 4. Timeline Data (Views & Unique Visitors Day-by-Day)
    const rawPageViews = await prisma.pageView.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    });

    const rawSessions = await prisma.session.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, visitorId: true },
    });

    // Populate timeline map
    const timelineMap: { [key: string]: { date: string; views: number; visitors: Set<string> } } = {};
    
    // Fill with empty days in range
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      timelineMap[dateStr] = { date: dateStr, views: 0, visitors: new Set<string>() };
      current.setDate(current.getDate() + 1);
    }
    // Also include end date key just in case
    const endStr = endDate.toISOString().split('T')[0];
    if (!timelineMap[endStr]) {
      timelineMap[endStr] = { date: endStr, views: 0, visitors: new Set<string>() };
    }

    rawPageViews.forEach(pv => {
      const key = pv.createdAt.toISOString().split('T')[0];
      if (timelineMap[key]) {
        timelineMap[key].views++;
      }
    });

    rawSessions.forEach(s => {
      const key = s.createdAt.toISOString().split('T')[0];
      if (timelineMap[key]) {
        timelineMap[key].visitors.add(s.visitorId);
      }
    });

    const timeline = Object.values(timelineMap).map(item => ({
      date: item.date,
      views: item.views,
      visitors: item.visitors.size,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      kpis: {
        pageViews: totalPageViews,
        visitors: uniqueVisitors,
        sessions: totalSessions,
        bounceRate,
        liveVisitors,
      },
      topPages: topPages.map(p => ({
        path: p.path,
        title: p.title || 'Untitled',
        views: p._count.id,
        avgDuration: p._avg.duration ? Math.round(p._avg.duration) : 0,
        avgScrollDepth: p._avg.scrollDepth ? Math.round(p._avg.scrollDepth) : 0,
      })),
      topReferrers: topReferrers.map(r => ({
        referrer: r.referrer || 'Direct / None',
        count: r._count.id,
      })),
      topCountries: topCountries.map(c => ({
        country: c.country || 'Unknown',
        count: c._count.id,
      })),
      topBrowsers: topBrowsers.map(b => ({
        browser: b.browser || 'Unknown',
        count: b._count.id,
      })),
      topDevices: topDevices.map(d => ({
        device: d.device || 'Desktop',
        count: d._count.id,
      })),
      topOS: topOS.map(o => ({
        os: o.os || 'Unknown',
        count: o._count.id,
      })),
      topUTMCampaigns: topUTMCampaigns.map(utm => ({
        campaign: utm.utmCampaign || 'Unknown',
        count: utm._count.id,
      })),
      timeline,
    });

  } catch (error: any) {
    console.error('[Stats API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
