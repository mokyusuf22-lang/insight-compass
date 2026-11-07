import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * Reports route changes to Google Analytics (only once the user has accepted analytics).
 * Sends the path only: IDs in paths like /coach/user/:id are replaced so they aren't sent to Google.
 */
export function PageViewTracker() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // gtag config already sent the first view
    trackPageView(pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id'));
  }, [pathname]);
  return null;
}
