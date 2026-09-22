import { useEffect, useState } from 'react';
import { hasUnreadReportNotifications } from '../utils/reports';

/** Powers the small dot on the "Bantuan Saya" menu item (ProfileDropdown)
 * and nav link (ProfileLayout) — true when this user has an unread
 * admin-reply/status-change notification on any of their reports. Not
 * real-time; re-checks on mount and whenever `refreshKey` changes. */
export function useUnreadReportReplies(userId, refreshKey = 0) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setHasUnread(false);
      return undefined;
    }
    hasUnreadReportNotifications(userId).then((value) => {
      if (active) setHasUnread(value);
    });
    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  return hasUnread;
}
