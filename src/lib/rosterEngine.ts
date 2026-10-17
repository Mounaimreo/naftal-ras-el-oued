import { DailyRoster, GroupId, RosterWorker, ShiftKey, Worker } from '../types';
import { OverridesMap } from './storage';

const SHIFT_PHASES: ShiftKey[] = ['morning', 'evening', 'night', 'rest'];

/**
 * Parses date string (YYYY-MM-DD) into UTC timestamp at noon to avoid timezone shifts.
 */
export function parseDateToNoonUtc(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0);
}

/**
 * Formats a Date or timestamp into YYYY-MM-DD string.
 */
export function formatDateString(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date in Africa/Algiers timezone formatted as YYYY-MM-DD.
 */
export function getStationToday(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Algiers',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const utc = parseDateToNoonUtc(dateStr);
  const next = new Date(utc + days * 86_400_000);
  return formatDateString(next);
}

/**
 * Calculates which shift a group is on for a given date.
 */
export function calculateGroupShift(
  targetDate: string,
  cycleStartDate: string,
  groupId: GroupId,
  groupOrder: GroupId[]
): ShiftKey {
  const targetTime = parseDateToNoonUtc(targetDate);
  const startTime = parseDateToNoonUtc(cycleStartDate);
  const diffDays = Math.floor((targetTime - startTime) / 86_400_000);

  // 8-day cycle, 2 days per phase
  const normalizedCycleDay = ((diffDays % 8) + 8) % 8; // 0 to 7
  const currentStep = Math.floor(normalizedCycleDay / 2); // 0 to 3

  const groupIndex = groupOrder.indexOf(groupId);
  if (groupIndex === -1) return 'rest';

  // Succession offsets for the 4 groups:
  // Group 0: currentStep
  // Group 1: currentStep + 3 (Rest at step 0, takes morning next)
  // Group 2: currentStep + 2 (Night at step 0)
  // Group 3: currentStep + 1 (Evening at step 0)
  const offset = groupIndex === 0 ? 0 : (4 - groupIndex);
  const phaseIndex = (currentStep + offset) % 4;

  return SHIFT_PHASES[phaseIndex];
}

/**
 * Computes the complete daily roster for all workers on a given date.
 */
export function getDailyRoster(
  dateStr: string,
  workers: Worker[],
  cycleStartDate: string,
  groupOrder: GroupId[],
  overrides: OverridesMap
): DailyRoster {
  const targetTime = parseDateToNoonUtc(dateStr);
  const startTime = parseDateToNoonUtc(cycleStartDate);
  const diffDays = Math.floor((targetTime - startTime) / 86_400_000);
  const cycleDayIndex = ((diffDays % 8) + 8) % 8;

  const dayOverrides = overrides[dateStr] || null;
  const isManualOverride = Boolean(dayOverrides);

  // Group shifts
  const groupShifts: Record<GroupId, ShiftKey> = {
    A: calculateGroupShift(dateStr, cycleStartDate, 'A', groupOrder),
    B: calculateGroupShift(dateStr, cycleStartDate, 'B', groupOrder),
    C: calculateGroupShift(dateStr, cycleStartDate, 'C', groupOrder),
    D: calculateGroupShift(dateStr, cycleStartDate, 'D', groupOrder),
  };

  const rosterWorkers: RosterWorker[] = workers.map(worker => {
    let assignedShift: ShiftKey;
    let isWorkerOverride = false;

    if (dayOverrides && dayOverrides[worker.id]) {
      assignedShift = dayOverrides[worker.id];
      isWorkerOverride = true;
    } else {
      assignedShift = groupShifts[worker.groupId] || 'rest';
    }

    return {
      ...worker,
      shift: assignedShift,
      isManualOverride: isWorkerOverride,
    };
  });

  return {
    date: dateStr,
    cycleStartDate,
    cycleDayIndex,
    isManualOverride,
    workers: rosterWorkers,
    groupShifts,
  };
}

/**
 * Formats date into Arabic friendly display.
 */
export function formatArabicDate(dateStr: string, options?: { showDayName?: boolean; showYear?: boolean }): string {
  try {
    const noon = parseDateToNoonUtc(dateStr);
    const date = new Date(noon);
    const showDay = options?.showDayName ?? true;
    const showYear = options?.showYear ?? true;

    return new Intl.DateTimeFormat('ar-DZ', {
      weekday: showDay ? 'long' : undefined,
      day: 'numeric',
      month: 'long',
      year: showYear ? 'numeric' : undefined,
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Returns month days list (YYYY-MM-DD) for a given year & month (1-indexed).
 */
export function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    days.push(`${year}-${monthStr}-${dayStr}`);
  }
  return days;
}

/**
 * Computes individual schedule for a worker over N days starting from startDate.
 */
export function getWorkerSchedule(
  workerId: string,
  startDateStr: string,
  daysCount: number,
  workers: Worker[],
  cycleStartDate: string,
  groupOrder: GroupId[],
  overrides: OverridesMap
): { date: string; shift: ShiftKey; isManual: boolean }[] {
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return [];

  const schedule: { date: string; shift: ShiftKey; isManual: boolean }[] = [];
  for (let i = 0; i < daysCount; i++) {
    const curDate = addDays(startDateStr, i);
    const dayRoster = getDailyRoster(curDate, workers, cycleStartDate, groupOrder, overrides);
    const assigned = dayRoster.workers.find(w => w.id === workerId);
    schedule.push({
      date: curDate,
      shift: assigned?.shift ?? 'rest',
      isManual: assigned?.isManualOverride ?? false,
    });
  }
  return schedule;
}
