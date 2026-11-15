import { apiGet } from '../lib/apiClient';

export const HELP_MESSAGE_STATUS_LABELS = {
  belum_dibalas: 'Belum dibalas',
  sudah_dibalas: 'Sudah dibalas',
};

export function fetchMyHelpMessages() {
  return apiGet('/api/help');
}
