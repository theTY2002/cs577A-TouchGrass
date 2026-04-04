/**
 * Chat panel: message list per event, input, Supabase persistence + realtime.
 * When chatUnlocked is false, messages are obscured and input is disabled until the user joins.
 * roomId is chat_rooms.r_id from the API (not the event/post id).
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../tools/supabaseClient';
import { useSession } from '../tools/cache/SessionContext';
import { fetchUserDisplayNamesByIds } from '../tools/api';

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (_) {
    return '';
  }
}

/** Map chat_messages.sender_user_id → label via Postgres users row (API, not Supabase RLS). */
async function resolveLabelsForSenderIds(userIds) {
  const unique = [
    ...new Set(
      userIds
        .filter((id) => id != null && id !== '')
        .map((id) => String(id)),
    ),
  ].filter((s) => s && s !== 'null' && s !== 'undefined');
  if (unique.length === 0) return {};
  return fetchUserDisplayNamesByIds(unique);
}

/**
 * @param {object} props
 * @param {string|null|undefined} props.roomId — chat_rooms.r_id (FK target for chat_messages.room_id)
 */
function newRealtimeTopicSuffix() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function ChatPanel({ roomId, inModal = false, chatUnlocked = true }) {
  const { user } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** @type {import('react').MutableRefObject<Record<string, string>>} */
  const senderNamesRef = useRef({});
  const [senderNames, setSenderNames] = useState(() => ({}));
  const listRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setLoading(true);
      setError('');
      setSenderNames({});
      senderNamesRef.current = {};

      const roomIdNum = roomId != null && roomId !== '' ? Number(roomId) : NaN;
      if (!Number.isFinite(roomIdNum)) {
        if (!active) return;
        setLoading(false);
        setMessages([]);
        setError('Chat is not available for this event.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('m_id, room_id, sender_user_id, content, created_at')
          .eq('room_id', roomIdNum)
          .order('created_at', { ascending: true });

        if (!active) return;

        if (error) {
          console.error('Could not load chat messages:', error);
          setError('Could not load chat messages.');
          setMessages([]);
        } else {
          const rows = data || [];
          setMessages(
            rows.map((m) => ({
              id: m.m_id,
              text: m.content,
              sender:
                m.sender_user_id != null && m.sender_user_id !== ''
                  ? String(m.sender_user_id)
                  : '',
              createdAt: m.created_at,
            }))
          );

          const senderIds = rows.map((m) => m.sender_user_id).filter((id) => id != null && id !== '');
          const nameMap = await resolveLabelsForSenderIds(senderIds);
          if (!active) return;
          senderNamesRef.current = nameMap;
          setSenderNames(nameMap);
        }
      } catch (e) {
        console.error('Chat load failed:', e);
        if (!active) return;
        setError('Could not load chat messages.');
        setMessages([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (roomId) {
      loadMessages();
    } else {
      setLoading(false);
      setError('Chat is not available for this event.');
      setMessages([]);
      setSenderNames({});
      senderNamesRef.current = {};
    }

    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const roomIdNum = Number(roomId);
    if (!Number.isFinite(roomIdNum)) return;

    /** New topic on every effect run: Supabase de-dupes by name; Strict Mode + two panels must never reuse a subscribed topic. */
    const channelTopic = `chat-room-${roomIdNum}-${newRealtimeTopicSuffix()}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomIdNum}`,
        },
        (payload) => {
          const row = payload?.new;
          if (!row) return;

          setMessages((prev) => {
            const alreadyExists = prev.some((m) => String(m.id) === String(row.m_id));
            if (alreadyExists) return prev;

            return [
              ...prev,
              {
                id: row.m_id,
                text: row.content,
                sender:
                  row.sender_user_id != null && row.sender_user_id !== ''
                    ? String(row.sender_user_id)
                    : '',
                createdAt: row.created_at,
              },
            ];
          });

          if (row.sender_user_id == null || row.sender_user_id === '') return;
          const sid = String(row.sender_user_id);
          if (!senderNamesRef.current[sid]) {
            void resolveLabelsForSenderIds([row.sender_user_id]).then((map) => {
              senderNamesRef.current = { ...senderNamesRef.current, ...map };
              setSenderNames((p) => ({ ...p, ...map }));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    if (listRef.current && chatUnlocked) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, chatUnlocked]);

  const handleSend = async () => {
    if (!chatUnlocked) return;
    const text = input.trim();
    if (!text) return;

    const senderId = user?.id;
    if (!senderId) {
      setError('You must be signed in to send messages.');
      return;
    }

    setError('');

    const roomIdNum = roomId != null && roomId !== '' ? Number(roomId) : NaN;
    if (!Number.isFinite(roomIdNum)) {
      setError('Chat is not available for this event.');
      return;
    }

    const { error: insertError } = await supabase.from('chat_messages').insert({
      room_id: roomIdNum,
      sender_user_id: senderId,
      content: text,
    });

    if (insertError) {
      console.error('Could not send message:', insertError);
      setError('Could not send message.');
      return;
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (!chatUnlocked) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const shellClass = inModal
    ? /* flex-1 + min-h-0: modal parent must not rely on h-full (breaks when ancestor height is auto on mobile WebKit). */
      'flex min-h-0 flex-1 flex-col bg-bg-white'
    : [
        'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200/80',
        'bg-white/98 shadow-[0_12px_48px_-14px_rgba(0,0,0,0.14),0_4px_20px_-6px_rgba(116,136,115,0.12)]',
        'ring-1 ring-black/[0.04] backdrop-blur-sm transition-all duration-300',
        'hover:shadow-[0_16px_56px_-14px_rgba(0,0,0,0.16),0_6px_24px_-6px_rgba(116,136,115,0.14)]',
      ].join(' ');

  return (
    <section
      className={shellClass}
      aria-label="Group chat"
      aria-describedby={!chatUnlocked ? 'chat-locked-hint' : undefined}
    >
      {!inModal && (
        <header className="shrink-0 border-b border-stone-100/90 bg-gradient-to-b from-stone-50/80 to-stone-50/30 px-5 py-4 sm:px-6 sm:py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-forest/12 text-brand-forest">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M3.505 2.75A1.25 1.25 0 002.25 4v10a1.25 1.25 0 001.25 1.25h2.5a.75.75 0 01.75.75v3.19l3.427-3.427a.75.75 0 01.53-.22h6.793A1.25 1.25 0 0018.75 14V4a1.25 1.25 0 00-1.25-1.25H3.505z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Group chat</h2>
              <p className="mt-0.5 text-sm text-gray-500">Plan together with everyone going</p>
              {chatUnlocked ? (
                <p className="mt-1 text-xs font-medium text-gray-400">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-amber-800/80">Join the event to unlock</p>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          className="h-full min-h-0 overflow-y-auto bg-gradient-to-b from-stone-50/40 via-white to-stone-50/20 scrollbar-hide"
        >
          <div
            className={`min-h-[12rem] space-y-4 px-4 py-4 transition-all duration-300 sm:space-y-5 sm:px-6 sm:py-5 sm:pb-6 ${
              !chatUnlocked ? 'pointer-events-none select-none blur-[7px] opacity-[0.32]' : ''
            }`}
            aria-hidden={!chatUnlocked}
          >
            {loading ? (
              <div className="flex min-h-[14rem] items-center justify-center text-sm text-gray-500">
                Loading chat...
              </div>
            ) : error ? (
              <div className="flex min-h-[14rem] items-center justify-center text-sm text-red-600">
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[14rem] flex-col items-center justify-center gap-3 px-4 text-center sm:min-h-[15rem]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-forest/15 to-brand-terracotta/20 text-2xl shadow-inner">
                  <span aria-hidden>👋</span>
                </div>
                <p className="text-base font-semibold text-gray-800">Start the conversation 👋</p>
                <p className="max-w-[260px] text-sm leading-relaxed text-gray-500">
                  Be the first to say hi, ask a question, or coordinate plans with other attendees.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender !== '' && String(m.sender) === String(user?.id);
                return (
                  <div
                    key={m.id}
                    className={`animate-chat-message flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[min(88%,22rem)] rounded-2xl px-4 py-3 transition-all duration-200 ${
                        mine
                          ? 'rounded-br-md bg-brand-forest text-white shadow-md shadow-brand-forest/30 ring-1 ring-white/10'
                          : 'rounded-bl-md border border-stone-200/90 bg-white text-gray-900 shadow-md shadow-stone-300/40 ring-1 ring-black/[0.03]'
                      }`}
                    >
                      <div className={`flex items-baseline justify-between gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-[11px] font-semibold ${mine ? 'text-white/90' : 'text-brand-forest'}`}>
                          {mine
                            ? 'You'
                            : !m.sender
                              ? 'System'
                              : senderNames[m.sender] || `User ${m.sender}`}
                        </span>
                        <span className={`text-[10px] tabular-nums ${mine ? 'text-white/55' : 'text-gray-400'}`}>
                          {formatTime(m.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`mt-1.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words ${
                          mine ? 'text-white' : 'text-gray-800'
                        }`}
                      >
                        {m.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {!chatUnlocked && (
          <div
            id="chat-locked-hint"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-white/88 via-stone-50/92 to-white/90 px-6 py-10 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all duration-300 ease-out"
            role="status"
            aria-live="polite"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100/90 text-3xl shadow-md ring-1 ring-stone-200/80">
              <span aria-hidden>🔒</span>
            </div>
            <p className="text-base font-semibold tracking-tight text-gray-800">Group chat is locked</p>
            <p className="max-w-[280px] text-sm leading-relaxed text-gray-600">
              Join this event to view and participate in the chat.
            </p>
          </div>
        )}
      </div>

      <div
        className={`shrink-0 border-t border-stone-100/90 bg-white/95 p-3 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.06)] transition-opacity duration-300 sm:p-4 ${
          !chatUnlocked ? 'pointer-events-none opacity-55' : ''
        }`}
      >
        {error && (
          <p className="mb-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => chatUnlocked && setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatUnlocked ? 'Ask a question or say hi…' : 'Join the event to chat…'}
            disabled={!chatUnlocked}
            readOnly={!chatUnlocked}
            className="min-w-0 flex-1 rounded-xl border border-stone-200/90 bg-stone-50/70 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-brand-forest/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/20 disabled:cursor-not-allowed disabled:bg-stone-100/80 disabled:text-gray-500"
            aria-label="Chat message input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!chatUnlocked}
            className="shrink-0 rounded-xl bg-brand-forest px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-forest/25 transition-all duration-200 hover:bg-brand-forest/90 hover:shadow-lg hover:shadow-brand-forest/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-forest disabled:hover:shadow-md"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}