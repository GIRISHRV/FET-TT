import { useMemo } from 'react';
import { parseSlotText, getPeriodsForBatch } from '../utils';

export function useDaySchedule(batch, selectedSubjects, dayName) {
  return useMemo(() => {
    if (!batch) return [];
    const dayData = batch.grid[dayName];
    if (!dayData) return [];

    const dynamicPeriods = getPeriodsForBatch(batch);

    return Object.keys(dayData).sort((a,b)=>Number(a)-Number(b)).map(key => {
      const slotObj = dayData[key];
      const index = Number(key) - 1;
      const slot = slotObj.text;
      
      // T7: read from dynamicPeriods instead of PERIODS
      const basePeriod = dynamicPeriods[index] || dynamicPeriods[dynamicPeriods.length - 1];

      // Exclude lab-continue as it's just the second half of a lab
      if (slotObj.type === 'lab-continue') return null;

      // T6: Fix lab duration truncation
      let periodEnd = basePeriod.end;
      if (slotObj.colspan > 1) {
        const endIndex = index + slotObj.colspan - 1;
        const endPeriod = dynamicPeriods[endIndex];
        if (endPeriod) {
          periodEnd = endPeriod.end;
        }
      }
      
      const period = { ...basePeriod, end: periodEnd };

      if (!slot || slotObj.type === 'free') {
        return {
          id: index + 1,
          period,
          code: 'Free Period',
          name: 'Free Period',
          room: '',
          isLab: false,
          taking: false,
          isFreeSlot: true,
          isLunch: false,
          colspan: slotObj.colspan || 1
        };
      }

      if (slotObj.type === 'lunch') {
        return {
          id: index + 1,
          period,
          code: 'Lunch Break',
          name: 'Lunch Break',
          room: '',
          isLab: false,
          taking: true,
          isLunch: true,
          isFreeSlot: false,
          colspan: slotObj.colspan || 1
        };
      }

      const parsed = parseSlotText(slot);
      if (!parsed) return null;

      // Consider subject untaken if it matches in subjects list and is not in selectedSubjects
      const matchedSubject = batch.subjects.find(s => parsed.code.startsWith(s.code));
      const taking = matchedSubject ? selectedSubjects.includes(matchedSubject.code) : true;

      return {
        id: index + 1,
        period,
        ...parsed,
        name: matchedSubject ? matchedSubject.name : null,
        taking,
        isFreeSlot: false,
        isLunch: false,
        colspan: slotObj.colspan || 1
      };
    }).filter(Boolean);
  }, [batch, selectedSubjects, dayName]);
}
