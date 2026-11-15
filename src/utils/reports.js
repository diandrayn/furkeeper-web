import { apiGet, apiPost } from '../lib/apiClient';
import { REPORT_CATEGORY_LABELS, REPORT_STATUS_LABELS } from './admin';

export { REPORT_CATEGORY_LABELS, REPORT_STATUS_LABELS };

export class ReportError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export async function submitReport(payload) {
  try {
    const { id } = await apiPost('/api/reports', payload);
    return id;
  } catch (error) {
    if (error.code === 'self' || error.code === 'duplicate') {
      throw new ReportError(error.code, error.message);
    }
    throw error;
  }
}

export function fetchMyReports() {
  return apiGet('/api/reports');
}

export function fetchMyReportMessages(reportId) {
  return apiGet(`/api/reports/${encodeURIComponent(reportId)}/messages`);
}

export function sendMyReportReply(reportId, _userId, body) {
  return apiPost(`/api/reports/${encodeURIComponent(reportId)}/messages`, { body });
}

export async function hasUnreadReportNotifications() {
  const { unread } = await apiGet('/api/reports', { unread: 1 });
  return unread;
}

export function markReportNotificationsRead() {
  return apiPost('/api/reports', { action: 'mark-read' });
}
