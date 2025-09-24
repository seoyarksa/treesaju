// utils/time.js
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatDateKST(input) {
  return dayjs(input).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
}
