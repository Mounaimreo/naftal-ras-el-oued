import { Worker, GroupId, ShiftSwapRequest, HandoverReport, ChatMessage, ShiftKey } from '../types';
import { DEFAULT_WORKERS, STATION_INFO } from './constants';

const KEYS = {
  WORKERS: 'naftal_workers_v1',
  CYCLE_START_DATE: 'naftal_cycle_start_v1',
  GROUP_ORDER: 'naftal_group_order_v1',
  DAILY_OVERRIDES: 'naftal_overrides_v1',
  SWAP_REQUESTS: 'naftal_swaps_v1',
  HANDOVERS: 'naftal_handovers_v1',
  CHAT_MESSAGES: 'naftal_chat_v1',
  ADMIN_PIN: 'naftal_admin_pin_v1',
  CUSTOM_STATION_NAME: 'naftal_custom_name_v1',
};

// Safe JSON helper
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

// Workers
export function getStoredWorkers(): Worker[] {
  const workers = load<Worker[]>(KEYS.WORKERS, []);
  if (!workers || workers.length === 0) {
    save(KEYS.WORKERS, DEFAULT_WORKERS);
    return DEFAULT_WORKERS;
  }
  return workers;
}

export function saveStoredWorkers(workers: Worker[]): void {
  save(KEYS.WORKERS, workers);
}

// Cycle Start Date
export function getStoredCycleStartDate(): string {
  return load<string>(KEYS.CYCLE_START_DATE, STATION_INFO.defaultCycleStartDate);
}

export function saveStoredCycleStartDate(date: string): void {
  save(KEYS.CYCLE_START_DATE, date);
}

// Group Order
export function getStoredGroupOrder(): GroupId[] {
  return load<GroupId[]>(KEYS.GROUP_ORDER, ['A', 'B', 'C', 'D']);
}

export function saveStoredGroupOrder(order: GroupId[]): void {
  save(KEYS.GROUP_ORDER, order);
}

// Daily Overrides
export type OverridesMap = Record<string, Record<string, ShiftKey>>; // date -> workerId -> shift

export function getStoredOverrides(): OverridesMap {
  return load<OverridesMap>(KEYS.DAILY_OVERRIDES, {});
}

export function saveStoredOverrides(overrides: OverridesMap): void {
  save(KEYS.DAILY_OVERRIDES, overrides);
}

export function setDayOverride(date: string, workerAssignments: Record<string, ShiftKey>): void {
  const current = getStoredOverrides();
  current[date] = workerAssignments;
  saveStoredOverrides(current);
}

export function removeDayOverride(date: string): void {
  const current = getStoredOverrides();
  delete current[date];
  saveStoredOverrides(current);
}

// Swap Requests
export function getStoredSwapRequests(): ShiftSwapRequest[] {
  return load<ShiftSwapRequest[]>(KEYS.SWAP_REQUESTS, [
    {
      id: 'swap-demo-1',
      requesterId: 'w-2',
      requesterName: 'كريم منصوري',
      recipientId: 'w-5',
      recipientName: 'هشام زواوي',
      date: new Date().toISOString().slice(0, 10),
      originalShift: 'morning',
      targetShift: 'evening',
      reason: 'ظرف عائلي طارئ في الصباح',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  ]);
}

export function saveStoredSwapRequests(requests: ShiftSwapRequest[]): void {
  save(KEYS.SWAP_REQUESTS, requests);
}

// Handovers
export function getStoredHandovers(): HandoverReport[] {
  return load<HandoverReport[]>(KEYS.HANDOVERS, [
    {
      id: 'h-demo-1',
      date: new Date().toISOString().slice(0, 10),
      shift: 'morning',
      supervisorName: 'عبد المالك بلعابد',
      gasoilMeter: '142,850 لتر',
      sansPlombMeter: '98,420 لتر',
      gplMeter: '12,600 م³',
      notes: 'تمت الوردية في ظروف ممتازة، لا تسجيل لأي أعطال بمضخات الوقود.',
      createdAt: new Date().toISOString(),
    }
  ]);
}

export function saveStoredHandovers(handovers: HandoverReport[]): void {
  save(KEYS.HANDOVERS, handovers);
}

// Chat Messages
export function getStoredChatMessages(): ChatMessage[] {
  return load<ChatMessage[]>(KEYS.CHAT_MESSAGES, [
    {
      id: 'msg-1',
      senderId: 'w-1',
      senderName: 'عبد المالك بلعابد',
      senderRole: 'رئيس فوج',
      content: 'السلام عليكم يا خاوة، شاحنة تزويد المازوت تصل حوالي الساعة 11:30 صباحاً.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg-2',
      senderId: 'w-7',
      senderName: 'رابح دحماني',
      senderRole: 'رئيس فوج',
      content: 'وعليكم السلام، تم تفقد صهريج غاز البترول المسال GPL وكل المؤشرات عادية.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]);
}

export function saveStoredChatMessages(messages: ChatMessage[]): void {
  save(KEYS.CHAT_MESSAGES, messages);
}

// Admin PIN
export function getStoredAdminPin(): string {
  return load<string>(KEYS.ADMIN_PIN, STATION_INFO.defaultAdminPin);
}

export function saveStoredAdminPin(pin: string): void {
  save(KEYS.ADMIN_PIN, pin);
}

// Full Backup & Restore
export function exportStationData(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    stationName: STATION_INFO.name,
    workers: getStoredWorkers(),
    cycleStartDate: getStoredCycleStartDate(),
    groupOrder: getStoredGroupOrder(),
    overrides: getStoredOverrides(),
    swapRequests: getStoredSwapRequests(),
    handovers: getStoredHandovers(),
    chatMessages: getStoredChatMessages(),
  };
  return JSON.stringify(data, null, 2);
}

export function importStationData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.workers)) saveStoredWorkers(data.workers);
    if (typeof data.cycleStartDate === 'string') saveStoredCycleStartDate(data.cycleStartDate);
    if (Array.isArray(data.groupOrder)) saveStoredGroupOrder(data.groupOrder);
    if (data.overrides) saveStoredOverrides(data.overrides);
    if (Array.isArray(data.swapRequests)) saveStoredSwapRequests(data.swapRequests);
    if (Array.isArray(data.handovers)) saveStoredHandovers(data.handovers);
    if (Array.isArray(data.chatMessages)) saveStoredChatMessages(data.chatMessages);
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

export function resetToDefaults(): void {
  saveStoredWorkers(DEFAULT_WORKERS);
  saveStoredCycleStartDate(STATION_INFO.defaultCycleStartDate);
  saveStoredGroupOrder(['A', 'B', 'C', 'D']);
  saveStoredOverrides({});
}
