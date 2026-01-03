import axios from "axios";
import { useEffect, useState, useMemo, useRef } from "react";
import { EllipsisVerticalIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function ChatList({ onSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [query, setQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const searchTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");
  const userId = Number(localStorage.getItem("user_id"));
  const navigate = useNavigate();

  const headers = useMemo(() => ({ headers: { Authorization: `Token ${token}` } }), [token]);

  const getFullImageUrl = (p) => {
    if (!p) return "/default_avatar.svg";
    return p.startsWith("http") ? p : `http://127.0.0.1:8000${p}`;
  };

  /* ---------------- FETCH CHATS ---------------- */
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/chats_view",
          headers
        );
        // dedupe by other participant (prefer unread or most recent)
        const byOther = {};
        res.data.forEach((c) => {
          const other = c.participants.find((p) => p.id !== userId);
          const key = other?.id ?? `chat_${c.id}`;
          if (!byOther[key]) byOther[key] = c;
          else {
            const existing = byOther[key];
            const existingTime = existing.last_message?.created_at ? new Date(existing.last_message.created_at).getTime() : 0;
            const cTime = c.last_message?.created_at ? new Date(c.last_message.created_at).getTime() : 0;
            if ((c.unread_count || 0) > (existing.unread_count || 0) || cTime > existingTime) byOther[key] = c;
          }
        });
        const deduped = Object.values(byOther);
        setChats(deduped);
      } catch (err) {
        console.error("Failed to load chats", err);
      }
    };

    fetchChats();
    const timer = setInterval(fetchChats, 3000);
    window.addEventListener("chats:refresh", fetchChats);

    return () => {
      clearInterval(timer);
      window.removeEventListener("chats:refresh", fetchChats);
    };
  }, [headers, userId]);

  /* ---------------- SEARCH ---------------- */
  const handleSearch = (q) => {
    setQuery(q);
    // local filter first
    if (!q) {
      setFilteredChats([]);
    } else {
      const lc = q.toLowerCase();
      setFilteredChats(chats.filter(c => (c.participants.find(p => p.id !== userId)?.name || '').toLowerCase().includes(lc) || (c.last_message?.text || '').toLowerCase().includes(lc)));
    }

    // debounce remote search for users
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      if (!q) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/search_users`, {
          params: { q },
          headers: { Authorization: `Token ${token}` },
        });
        setSearchResults(res.data || []);
      } catch (err) {
        // if endpoint doesn't exist, ignore (we still have local filtering)
        setSearchResults([]);
      }
    }, 300);
  };

  /* ---------------- ACTIONS ---------------- */
  const openChat = (chat) => {
    onSelect(chat);
    navigate(`/messagefeed/${chat.id}`);
  };

  const askReportChat = (chatId) => {
    setMenuOpen(null);
    const chatObj = chats.find(c => c.id === chatId);
    const lastMessage = chatObj?.last_message;
    if (!lastMessage) {
      alert("No messages to report in this chat");
      return;
    }
    const other = chatObj.participants.find((p) => p.id !== userId);
    navigate('/report', { state: { contentType: 'message', contentDetails: { id: lastMessage.id, user: other?.name || '', date: lastMessage.created_at } } });
  };

  return (
    <>
      {/* CHAT LIST */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r">
        <div className="p-4 flex flex-col gap-3 border-b">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/home'); }}>
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="font-semibold">Chats</h2>
          </div>

          {/* Search users / chats */}
          <div className="mt-2">
            <input
              value={typeof query === 'string' ? query : ''}
              onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
              placeholder="Search users or chats..."
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="divide-y">
          {searchResults.length > 0 && (
            <div className="p-3">
              <div className="text-xs text-gray-500 mb-2">Search results</div>
              {searchResults.map((u) => (
                <div key={u.id} className="p-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded" onClick={async () => { try { const res = await axios.post('http://127.0.0.1:8000/api/chats_view', { user_id: u.id }, headers); onSelect(res.data); navigate(`/messagefeed/${res.data.id}`); } catch (e) { console.error('create chat failed', e); } }}>
                  <img src={u.profile_pic || '/default_avatar.svg'} alt={u.name || u.username || 'user'} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="font-medium">{u.name || u.username || 'User'}</div>
                    <div className="text-xs text-gray-500">{u.email || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(filteredChats.length ? filteredChats : chats).map((c) => {
            const other =
              c.participants.find((p) => p.id !== userId) || {};

            return (
              <div
                key={c.id}
                className={`p-3 flex items-center gap-3 cursor-pointer ${
                  selectedChatId === c.id ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex-1" onClick={() => openChat(c)}>
                  <div className="flex items-center gap-3">
                    <img
                      src={getFullImageUrl(other.profile_pic)}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                      alt=""
                      onClick={(e) => { e.stopPropagation(); navigate(`/userinfo/${other.id}`); }}
                    />
                    <div>
                      <div className="font-semibold cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/userinfo/${other.id}`); }}>
                        {other.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {c.last_message?.text || "No messages yet"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pr-2">
                  {c.unread_count > 0 && (
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {c.unread_count}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {c.last_message ? new Date(c.last_message.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                  </div>
                </div>

                {/* MENU */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === c.id ? null : c.id);
                    }}
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>

                  {menuOpen === c.id && (
                    <div className="absolute right-0 top-8 bg-white shadow rounded z-10">
                      <button
                        onClick={() => askReportChat(c.id)}
                        className="px-4 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left"
                      >
                        Report Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </>
  );
}
