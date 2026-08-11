import { parse, format } from 'date-fns';

/**
 * Parses slot text. E.g., "AI&DS(P)(L) in 127B [AC]" -> { code: "AI&DS(P)", room: "127B [AC]", isLab: true }
 */
export function parseSlotText(text) {
  if (!text || typeof text !== 'string') return null;
  
  const isLab = text.includes('(L)');
  let cleanText = text.replace('(L)', '').trim();
  
  const inIndex = cleanText.lastIndexOf(' in ');
  if (inIndex !== -1) {
    return {
      code: cleanText.substring(0, inIndex).trim(),
      room: cleanText.substring(inIndex + 4).trim(),
      isLab
    };
  }
  
  return { code: cleanText, room: '', isLab };
}

/**
 * Converts 24-hour time "HH:mm" to 12-hour time "h:mm a"
 */
export function formatTime12h(time24) {
  if (!time24) return '';
  try {
    const d = parse(time24, 'HH:mm', new Date());
    return format(d, 'h:mm a');
  } catch (e) {
    return time24;
  }
}

/**
 * Gets the current day name in short format matching JSON (Mon, Tue, etc.)
 */
export function getTodayDayName() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

export const PERIODS = [
  { id: 1, start: '08:45', end: '09:35' },
  { id: 2, start: '09:40', end: '10:30' },
  { id: 3, start: '10:35', end: '11:25' },
  { id: 4, start: '11:30', end: '12:20' },
  { id: 5, start: '12:25', end: '13:15' },
  { id: 6, start: '13:20', end: '14:10' },
  { id: 7, start: '14:15', end: '15:05' },
  { id: 8, start: '15:10', end: '16:00' },
];

export function toMins(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function getPeriodsForBatch(batch) {
  if (!batch || !batch.periodLabels) return PERIODS;

  try {
    const periods = [];
    for (const [key, label] of Object.entries(batch.periodLabels)) {
      const match = label.match(/\((.*?)-(.*?)\)/);
      if (match) {
        let [, start, end] = match;
        
        // Convert to 24h format
        const to24h = (timeStr) => {
          let [h, m] = timeStr.split(':');
          let hr = parseInt(h, 10);
          if (hr < 8) hr += 12; // anything before 8am is actually PM in this context
          return `${hr.toString().padStart(2, '0')}:${m}`;
        };

        periods.push({
          id: parseInt(key, 10),
          start: to24h(start),
          end: to24h(end)
        });
      }
    }
    // Sort by id just in case
    periods.sort((a, b) => a.id - b.id);
    if (periods.length === 0) return PERIODS;
    return periods;
  } catch (e) {
    console.error("Error parsing periods:", e);
    return PERIODS;
  }
}

export function getCurrentPeriod(batch) {
  const periods = getPeriodsForBatch(batch);
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const p of periods) {
    if (mins >= toMins(p.start) && mins <= toMins(p.end)) return p;
  }
  return null;
}
