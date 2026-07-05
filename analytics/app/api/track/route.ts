import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
import UAParser from 'ua-parser-js';
import prisma from '@/lib/prisma';

// Helper to set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'pageview') {
      const {
        sessionId,
        visitorId,
        path,
        title,
        referrer,
        screenResolution,
        utmSource,
        utmMedium,
        utmCampaign,
      } = body;

      // Extract client information from Vercel headers & User-Agent
      const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
      const rawCity = request.headers.get('x-vercel-ip-city') || 'Unknown';
      const city = rawCity !== 'Unknown' ? decodeURIComponent(rawCity) : 'Unknown';

      const ua = request.headers.get('user-agent') || '';
      const parser = new UAParser(ua);
      const browser = parser.getBrowser().name 
        ? `${parser.getBrowser().name} ${parser.getBrowser().version || ''}`.trim()
        : 'Unknown';
      const device = parser.getDevice().type || 'Desktop';
      const os = parser.getOS().name 
        ? `${parser.getOS().name} ${parser.getOS().version || ''}`.trim()
        : 'Unknown';

      // Upsert Session
      await prisma.session.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          visitorId,
          country,
          city,
          browser,
          device,
          os,
          screenResolution,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
        },
        update: {}, // Keep original session info unchanged
      });

      // Create Page View
      await prisma.pageView.create({
        data: {
          sessionId,
          path,
          title,
        },
      });

    } else if (type === 'pageview_exit') {
      const { sessionId, path, duration, scrollDepth } = body;

      // Find the last pageview in the current session for this path
      const lastPageView = await prisma.pageView.findFirst({
        where: {
          sessionId,
          path,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (lastPageView) {
        await prisma.pageView.update({
          where: { id: lastPageView.id },
          data: {
            duration: duration ? Math.min(duration, 3600) : null, // Cap duration at 1 hour
            scrollDepth: scrollDepth ? Math.min(scrollDepth, 100) : null,
          },
        });
      }

    } else if (type === 'event') {
      const { sessionId, eventType, elementId, elementText, path } = body;

      await prisma.userEvent.create({
        data: {
          sessionId,
          eventType,
          elementId,
          elementText,
          path,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('[Track API Error]:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}
