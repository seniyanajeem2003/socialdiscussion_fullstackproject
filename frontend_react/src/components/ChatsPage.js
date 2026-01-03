import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ChatList from "./ChatList";
import MessageFeed from "./MessageFeed";

export default function ChatsPage() {
  const { id } = useParams();
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchChat = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://127.0.0.1:8000/api/chats_view",
          { headers: { Authorization: `Token ${token}` } }
        );

        const found = res.data.find((c) => String(c.id) === String(id));
        if (found) setSelectedChat(found);
        else {
          // if id is not chat id, try to create chat with user id
          try {
            const token = localStorage.getItem("token");
            const createRes = await axios.post(
              "http://127.0.0.1:8000/api/chats_view",
              { user_id: Number(id) },
              { headers: { Authorization: `Token ${token}` } }
            );
            const chatId = createRes.data?.chat_id;
            // Try to refetch chats to obtain the full chat object (participants, last_message, etc.)
            try {
              const res2 = await axios.get(
                "http://127.0.0.1:8000/api/chats_view",
                { headers: { Authorization: `Token ${token}` } }
              );
              const full = res2.data.find((c) => String(c.id) === String(chatId));
              if (full) setSelectedChat(full);
              else setSelectedChat({ id: chatId }); // fallback to id-only
            } catch (e2) {
              console.error('failed to fetch created chat', e2);
              setSelectedChat({ id: chatId });
            }
          } catch (e) {
            console.error('failed to create chat', e);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchChat();
  }, [id]);

  return (
    <div className="min-h-screen flex">
      {/* On mobile only show one pane: chat list or message view */}
      {isMobile ? (
        selectedChat ? (
          <div className="w-full">
            <MessageFeed chat={selectedChat} onBack={() => setSelectedChat(null)} />
          </div>
        ) : (
          <div className="w-full">
            <ChatList selectedChatId={selectedChat?.id} onSelect={(c) => setSelectedChat(c)} />
          </div>
        )
      ) : (
        <>
          <ChatList selectedChatId={selectedChat?.id} onSelect={(c) => setSelectedChat(c)} />
          <MessageFeed chat={selectedChat} onBack={() => setSelectedChat(null)} />
        </>
      )}
    </div>
  );
}
