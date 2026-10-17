import React from 'react';
import { CalendarDays, SlidersHorizontal, CalendarRange, UserCheck, MessageCircle } from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isAdmin: boolean;
  unreadChatCount?: number;
}

export const MobileNavBar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  isAdmin,
  unreadChatCount = 0,
}) => {
  const tabs = [
    { id: 'today', label: 'وردية اليوم', Icon: CalendarDays },
    { id: 'control', label: 'أداة التحكم', Icon: SlidersHorizontal, highlight: isAdmin },
    { id: 'calendar', label: 'الجدول الشهري', Icon: CalendarRange },
    { id: 'personal', label: 'جدولي', Icon: UserCheck },
    { id: 'chat', label: 'الدردشة', Icon: MessageCircle, badge: unreadChatCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg lg:hidden no-print safe-bottom">
      <div className="grid grid-cols-5 h-15 max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon, highlight, badge }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`relative flex flex-col items-center justify-center py-1 transition-all ${
                isActive ? 'text-[#08264d] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-transform ${
                  isActive ? 'bg-[#f5d32e]/30 scale-105' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full px-1">
                {label}
              </span>

              {/* Indicator dot or badge */}
              {highlight && (
                <span className="absolute top-1.5 left-1/2 translate-x-2 w-1.5 h-1.5 rounded-full bg-[#e4b420]" />
              )}
              {badge && badge > 0 ? (
                <span className="absolute top-1 left-1/2 translate-x-3 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
