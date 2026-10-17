export type ShiftKey = 'morning' | 'evening' | 'night' | 'rest';

export type GroupId = 'A' | 'B' | 'C' | 'D';

export interface ShiftInfo {
  key: ShiftKey;
  title: string;
  shortTitle: string;
  timeRange: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  groupId: GroupId;
  orderInGroup: number;
  phone?: string;
  badgeNumber?: string;
  isActive: boolean;
  isPlaceholder?: boolean;
  avatarColor?: string;
  joinDate?: string;
  notes?: string;
}

export interface Group {
  id: GroupId;
  name: string;
  color: string;
  description: string;
}

export interface RosterWorker extends Worker {
  shift: ShiftKey;
  isManualOverride?: boolean;
}

export interface DailyRoster {
  date: string;
  cycleStartDate: string;
  cycleDayIndex: number; // 0 to 7
  isManualOverride: boolean;
  workers: RosterWorker[];
  groupShifts: Record<GroupId, ShiftKey>;
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  recipientId: string;
  recipientName: string;
  date: string;
  originalShift: ShiftKey;
  targetShift: ShiftKey;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface HandoverReport {
  id: string;
  date: string;
  shift: ShiftKey;
  supervisorName: string;
  gasoilMeter: string;
  sansPlombMeter: string;
  gplMeter: string;
  cashReport?: string;
  notes: string;
  incidents?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  createdAt: string;
}
