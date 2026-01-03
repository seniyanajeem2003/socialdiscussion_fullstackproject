import axios from "axios";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function MessageFeed({ chat, onBack }) {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMsgForOptions, setSelectedMsgForOptions] = useState(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(null);

  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const typingPollRef = useRef(null);

  const token = localStorage.getItem("token");
  const myId = Number(localStorage.getItem("user_id"));

  const headers = useMemo(() => ({ headers: { Authorization: `Token ${token}` } }), [token]);

  const otherUser = chat?.participants?.find((u) => u.id !== myId);

  const getFullImageUrl = (p) => {
    if (!p) return "/default_avatar.svg";
    return p.startsWith("http") ? p : `http://127.0.0.1:8000${p}`;
  };

  const isVideoUrl = (u) => {
    if (!u) return false;
    try {
      return (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u) || (u.includes('/media/') && u.toLowerCase().includes('.mp4')));
    } catch (e) { return false; }
  }; 

  /* ---------------- FETCH MESSAGES ---------------- */
  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/get_messages/${chat.id}/`,
          headers
        );
        setMessages(res.data);
        // if there are unread messages from other user, mark read
        if (res.data.some((m) => !m.is_read && m.sender.id !== myId)) {
          await axios.post(`http://127.0.0.1:8000/api/mark_read/${chat.id}/`, {}, headers).catch(() => {});
          window.dispatchEvent(new CustomEvent("chats:refresh"));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    const timer = setInterval(fetchMessages, 3000);

    // start typing poll
    if (typingPollRef.current) clearInterval(typingPollRef.current);
    typingPollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/get_typing/${chat.id}/`, headers);
        setTypingUsers(res.data.typing_users || []);
      } catch (e) {
        console.error('typing poll failed', e);
      }
    }, 1500);

    return () => {
      clearInterval(timer);
      if (typingPollRef.current) clearInterval(typingPollRef.current);
    };
  }, [chat, headers, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When a new chat is selected, focus the input box so user can start typing immediately
  useEffect(() => {
    if (!chat) return;
    inputRef.current?.focus();
  }, [chat]);

  // typing events: send typing=true while user is typing and then set false after 2s of inactivity
  useEffect(() => {
    if (!chat) return;
    if (!text) {
      // when cleared, send stop
      if (isTyping) {
        axios.post(`http://127.0.0.1:8000/api/typing/${chat.id}/`, { active: false }, headers).catch(()=>{});
        setIsTyping(false);
      }
      return;
    }

    if (!isTyping) {
      setIsTyping(true);
      axios.post(`http://127.0.0.1:8000/api/typing/${chat.id}/`, { active: true }, headers).catch(()=>{});
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      axios.post(`http://127.0.0.1:8000/api/typing/${chat.id}/`, { active: false }, headers).catch(()=>{});
      setIsTyping(false);
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [text, chat, isTyping, headers]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/send_message/${chat.id}/`,
        { text },
        headers
      );
      setMessages((prev) => [...prev, res.data]);
      setText("");
      window.dispatchEvent(new CustomEvent("chats:refresh"));
      // notify typing stopped
      await axios.post(`http://127.0.0.1:8000/api/typing/${chat.id}/`, { active: false }, headers).catch(()=>{});
      setIsTyping(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/delete_message/${messageId}/`, {}, headers);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true, text: "" } : m)));
      window.dispatchEvent(new CustomEvent("chats:refresh"));
    } catch (err) {
      console.error(err);
    }
  };

  // keep the dropdown within the viewport so it doesn't get clipped
  useEffect(() => {
    if (!showOptionsDropdown || !dropdownRef.current) {
      setAdjustedPosition(null);
      return;
    }

    const rect = dropdownRef.current.getBoundingClientRect();
    const margin = 8;
    let left = optionsPosition.x - 8;
    let top = optionsPosition.y;

    if (left + rect.width > window.innerWidth - margin) left = window.innerWidth - rect.width - margin;
    if (left < margin) left = margin;
    if (top + rect.height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - rect.height - margin);
    if (top < margin) top = margin;

    setAdjustedPosition({ left, top });
  }, [showOptionsDropdown, optionsPosition]);

  if (!chat)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a chat
      </div>
    );

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="sticky top-0 z-20 p-4 bg-white flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <button onClick={onBack}>
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <img
            src={getFullImageUrl(otherUser?.profile_pic)}
            alt={otherUser?.name || 'profile'}
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => navigate(`/userinfo/${otherUser?.id}`)}
          />

          <div className="flex flex-col">
            <span
              className="font-semibold cursor-pointer"
              onClick={() => navigate(`/userinfo/${otherUser?.id}`)}
            >
              {otherUser?.name}
            </span>
            <span className="text-xs text-gray-500">{typingUsers.find(u => u.id === otherUser?.id) ? "Typing..." : ""}</span>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white shadow rounded z-10">
              <button
                className="px-4 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left"
                onClick={async () => {
                  try {
                    await axios.post(`http://127.0.0.1:8000/api/delete_chat/${chat.id}/`, {}, headers);
                    window.dispatchEvent(new CustomEvent("chats:refresh"));
                    onBack();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 pb-20">
        {messages.map((m) => {
          const mine = m.sender.id === myId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs cursor-pointer ${
                  mine
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-800"
                }`}
                onClick={(e) => {
                  if (mine && !m.deleted) {
                    e.stopPropagation();
                    setSelectedMsgForOptions(m);
                    // position a little above click point so dropdown doesn't overlap finger
                    const x = e.clientX;
                    const y = Math.max(40, e.clientY - 10);
                    setOptionsPosition({ x, y });
                    setShowOptionsDropdown(true);
                  }
                }}
              >
                {m.deleted ? (
                  <em className="text-sm italic text-gray-400">Message deleted</em>
                ) : (
                  <>
                    <div>{m.text}</div>
                    {m.media_url && (
                      isVideoUrl(m.media_url) ? (
                        <video src={getFullImageUrl(m.media_url)} className="mt-2 max-w-xs rounded" controls />
                      ) : (
                        <img src={getFullImageUrl(m.media_url)} alt="message media" className="mt-2 max-w-xs rounded" />
                      )
                    )}
                  </>
                )}

                <div className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-2">
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>

                  {/* WhatsApp-style ticks: single gray when sent, double colored when read */}
                  {mine && !m.is_read && (
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 6L5 10L14 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {mine && m.is_read && (
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 6L5 10L14 1" stroke="#2B6CB0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 6L7 10L16 1" stroke="#2B6CB0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* typing indicator */}
      {typingUsers.find((u) => u.id === otherUser?.id) && (
        <div className="px-4 py-1 text-sm text-gray-500">{otherUser?.name} is typing...</div>
      )}

      {/* Contextual options dropdown near message */}
      {showOptionsDropdown && selectedMsgForOptions && (
        <>
          {/* click-catcher to close dropdown */}
          <div className="fixed inset-0 z-40" onClick={() => { setShowOptionsDropdown(false); setSelectedMsgForOptions(null); }} />

          <div
            ref={dropdownRef}
            className="fixed z-50 bg-white rounded-md shadow-md w-44 overflow-hidden"
            style={{ left: (adjustedPosition ? adjustedPosition.left : (optionsPosition.x - 8)), top: (adjustedPosition ? adjustedPosition.top : optionsPosition.y) }}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={async () => {
                try {
                  if (selectedMsgForOptions && selectedMsgForOptions.text) {
                    await navigator.clipboard.writeText(selectedMsgForOptions.text);
                    // small unobtrusive feedback
                    alert('Copied to clipboard');
                  }
                } catch (e) {
                  console.error('copy failed', e);
                } finally {
                  setShowOptionsDropdown(false);
                  setSelectedMsgForOptions(null);
                }
              }}
            >
              Copy
            </button>

            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
              onClick={() => {
                setShowOptionsDropdown(false);
                setShowDeleteConfirm(true);
              }}
            >
              Delete message
            </button>

            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
              onClick={() => {
                // navigate to report page for this specific message
                setShowOptionsDropdown(false);
                navigate('/report', { state: { contentType: 'message', contentDetails: { id: selectedMsgForOptions.id, user: selectedMsgForOptions.sender?.name || selectedMsgForOptions.sender_name, date: selectedMsgForOptions.created_at } } });
                setSelectedMsgForOptions(null);
              }}
            >
              Report message
            </button>

            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => { setShowOptionsDropdown(false); setSelectedMsgForOptions(null); }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Small delete confirmation modal (keeps it small and centered) */}
      {showDeleteConfirm && selectedMsgForOptions && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-64 shadow">
            <p className="text-sm text-gray-700 mb-4">Delete this message? It will be removed from your chat.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setSelectedMsgForOptions(null); }} className="px-3 py-1 border rounded text-sm">Cancel</button>
              <button onClick={async () => { if (selectedMsgForOptions) { await deleteMessage(selectedMsgForOptions.id); setShowDeleteConfirm(false); setSelectedMsgForOptions(null); } }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="sticky bottom-0 z-20 p-3 bg-white border-t flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 px-4 py-2 rounded-full bg-gray-100"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-5 py-2 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}
