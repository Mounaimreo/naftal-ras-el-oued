import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Lock, User, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { ChatMessage, Worker } from '../../types';

interface Props {
  messages: ChatMessage[];
  workers: Worker[];
  onSendMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  onClearChat?: () => void;
  isAdmin?: boolean;
}

export const TeamChatSection: React.FC<Props> = ({
  messages,
  workers,
  onSendMessage,
  onClearChat,
  isAdmin = false,
}) => {
  const [selectedSenderId, setSelectedSenderId] = useState<string>(() => workers[0]?.id || '');
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const sender = workers.find((w) => w.id === selectedSenderId);
    onSendMessage({
      senderId: selectedSenderId,
      senderName: sender?.name || 'عامل بالمحطة',
      senderRole: sender?.role || 'عامل توزيع وقود',
      content: text.trim(),
    });

    setText('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[520px] max-w-4xl mx-auto mb-8">
      {/* Header */}
      <div className="bg-[#08264d] text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center font-bold">
            <MessageCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black">دردشة وتنسيق فريق محطة نفطال</h3>
              <span className="bg-white/10 text-slate-200 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock size={10} /> خاص بالمحطة
              </span>
            </div>
            <span className="text-[11px] text-slate-300">
              تواصل داخلي فوري لتنسيق شاحنات الوقود وتسليم المناوبات
            </span>
          </div>
        </div>

        {isAdmin && onClearChat && messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('هل ترغب في مسح رسائل الدردشة القديمة؟')) {
                onClearChat();
              }
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/10 transition"
            title="مسح سجل الدردشة"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
        {messages.map((m) => {
          const isSender = m.senderId === selectedSenderId;
          const time = new Date(m.createdAt).toLocaleTimeString('ar-DZ', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Algiers',
          });

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                <strong className={isSender ? 'text-[#08264d]' : 'text-slate-800'}>
                  {m.senderName}
                </strong>
                {m.senderRole && <span>• {m.senderRole}</span>}
                <span className="text-[10px] text-slate-400">({time})</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                  isSender
                    ? 'bg-[#08264d] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <MessageCircle size={32} className="stroke-1 text-slate-300 mb-2" />
            <span>لا توجد رسائل بعد. ابدأ محادثة مع زملائك في المحطة!</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-500 shrink-0">
            الكتابة باسم:
          </label>
          <select
            value={selectedSenderId}
            onChange={(e) => setSelectedSenderId(e.target.value)}
            className="text-xs font-bold p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 max-w-[220px]"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role.slice(0, 15)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالة أو ملاحظة لفريق المحطة..."
            className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-[#08264d] bg-slate-50"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#08264d] hover:bg-[#123862] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <Send size={15} />
            <span className="hidden sm:inline">إرسال</span>
          </button>
        </div>
      </form>
    </div>
  );
};
