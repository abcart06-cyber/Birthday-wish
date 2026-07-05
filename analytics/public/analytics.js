(function () {
    // ── Configuration (Auto-detect deployed analytics host domain) ──
    const currentScript = document.currentScript;
    let host = '';
    if (currentScript && currentScript.src && currentScript.src.startsWith('http')) {
        try {
            host = new URL(currentScript.src).origin;
        } catch (e) {}
    }
    const endpoint = `${host}/api/track`;

    // ── Helper functions ──
    function getUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Get or create persistent visitor ID (lives forever)
    let visitorId = localStorage.getItem('__analytica_visitor_id');
    if (!visitorId) {
        visitorId = getUUID();
        localStorage.setItem('__analytica_visitor_id', visitorId);
    }

    // Get or create session ID (lives for current session/tab lifespan)
    let sessionId = sessionStorage.getItem('__analytica_session_id');
    if (!sessionId) {
        sessionId = getUUID();
        sessionStorage.setItem('__analytica_session_id', sessionId);
    }

    // ── State variables ──
    const startTime = Date.now();
    let maxScrollDepth = 0;

    // Parse UTM Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || null;
    const utmMedium = urlParams.get('utm_medium') || null;
    const utmCampaign = urlParams.get('utm_campaign') || null;

    // ── Track Page View (Entrance) ──
    function trackPageView() {
        const payload = {
            type: 'pageview',
            visitorId: visitorId,
            sessionId: sessionId,
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer || null,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            utmSource: utmSource,
            utmMedium: utmMedium,
            utmCampaign: utmCampaign
        };

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('[Analytics] Log failed:', err));
    }

    // ── Track Page Exit (Duration & Scroll) ──
    function trackPageExit() {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const payload = {
            type: 'pageview_exit',
            sessionId: sessionId,
            path: window.location.pathname,
            duration: duration,
            scrollDepth: maxScrollDepth
        };

        // Use keepalive: true to ensure payload is sent even if browser window is closing
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {});
    }

    // ── Track Clicks ──
    function trackClick(e) {
        const target = e.target.closest('a, button, [role="button"], .gallery-item, .book-card__sheet');
        if (!target) return;

        const payload = {
            type: 'event',
            sessionId: sessionId,
            path: window.location.pathname,
            eventType: 'click',
            elementId: target.id || null,
            elementText: target.textContent?.trim().substring(0, 50) || target.alt || target.className || 'element'
        };

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    // ── Monitor Scroll Depth ──
    function monitorScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollHeight <= 0) return;
        
        const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);
        if (scrollPercentage > maxScrollDepth) {
            maxScrollDepth = Math.min(scrollPercentage, 100);
        }
    }

    // Throttle scroll events
    let scrollTimeout;
    function throttledScroll() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                monitorScroll();
                scrollTimeout = null;
            }, 250);
        }
    }

    // ── Initialize ──
    if (document.readyState === 'complete') {
        trackPageView();
    } else {
        window.addEventListener('load', trackPageView);
    }

    // Event listeners
    window.addEventListener('scroll', throttledScroll);
    document.addEventListener('click', trackClick);
    
    // Page exit events
    window.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            trackPageExit();
        }
    });
    window.addEventListener('pagehide', trackPageExit); // Fallback for browsers without visibilitychange support
})();
