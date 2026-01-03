import { useState, useEffect } from "react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  PencilIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // theme state (light|dark) persisted in localStorage
  // initialize synchronously to avoid overwriting a saved preference on mount
    const userId = localStorage.getItem("user_id");

    const [theme, setTheme] = useState(() => {
      try {
        if (!userId) return "light";
        const saved = localStorage.getItem(`theme_${userId}`);
        return saved || "light"; // DEFAULT LIGHT
      } catch {
        return "light";
      }
    });

    useEffect(() => {
      if (!userId) return;

      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      localStorage.setItem(`theme_${userId}`, theme);
    }, [theme, userId]);

    const toggleTheme = () =>
      setTheme((t) => (t === "dark" ? "light" : "dark"));


  const tabs = [
    { key: "posts", title: "Posts", icon: ChatBubbleLeftEllipsisIcon },
    { key: "created", title: "Created", icon: PencilIcon },
    { key: "joined", title: "Joined", icon: UserGroupIcon },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/profile_dashboard", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setUser({
          username: data.user.name,
          bio: data.user.bio || "",
          profilePic: data.user.profile_pic
            ? `http://127.0.0.1:8000${data.user.profile_pic}`
            : "",
          posts: data.posts || [],
          createdCommunities: data.created_communities || [],
          joinedCommunities: data.joined_communities || [],
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, [navigate]);

  const handleCreatePost = () => navigate("/newpost");
  const handleCreateCommunity = () => navigate("/createcomm");
  const handleEditProfile = () => navigate("/profilesetting");

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  /* ================= POSTS GRID (INSTAGRAM STYLE) ================= */
    const renderPosts = (posts) => {
      const looksLikeVideo = (p) => p && (p.media_type === 'video' || /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(p.media_file || ''));
      return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {posts.length === 0 && (
          <p className="col-span-4 text-center text-gray-400 py-6">
            No posts yet
          </p>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="relative bg-gray-200 rounded overflow-hidden cursor-pointer h-48"
            onClick={() => navigate(`/postdetail/${post.id}`)}
          >
            {post.media_file ? (
              looksLikeVideo(post) ? (
                <video
                  src={post.media_file.startsWith('http') ? post.media_file : `http://127.0.0.1:8000${post.media_file}`}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay
                />
              ) : (
                <img
                  src={post.media_file.startsWith('http') ? post.media_file : `http://127.0.0.1:8000${post.media_file}`}
                  alt={`post ${post.id}`}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <img src={'https://via.placeholder.com/400'} alt={`post ${post.id}`} className="w-full h-full object-cover" />
            )} 
          </div>
        ))}
      </div>
      );
    }; 


  /* ================= COMMUNITIES (RECTANGLE CARDS) ================= */
    const renderCommunities = (communities) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {communities.length === 0 && (
          <p className="text-gray-400 col-span-2 text-center">
            No communities available
          </p>
        )}

        {communities.map((c) => (
          <div
            key={c.id}
            className="h-40 rounded-xl overflow-hidden shadow-md relative cursor-pointer"
            onClick={() => navigate(`/community/${c.id}`)}
          >
            <img
              src={
                c.thumbnail
                  ? `http://127.0.0.1:8000${c.thumbnail}`
                  : "https://via.placeholder.com/400"
              }
              className="w-full h-full object-cover"
              alt="community"
            />

            <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-end text-white">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-sm line-clamp-2">{c.description}</p>
            </div>
          </div>
        ))}
      </div>
    );


  const renderTabContent = () => {
    if (activeTab === "posts") return renderPosts(user.posts);
    if (activeTab === "created")
      return renderCommunities(user.createdCommunities);
    if (activeTab === "joined")
      return renderCommunities(user.joinedCommunities);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-6">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <div />

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <MoonIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-red-500 flex items-center gap-1"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      {/* PROFILE INFO */}
      <div className="flex flex-col items-center mb-4">
        {user.profilePic ? (
          <img
            src={user.profilePic}
            className="w-24 h-24 rounded-full object-cover border-4 border-cyan-400"
            alt="profile"
          />
        ) : (
          <UserCircleIcon className="w-24 h-24 text-gray-400" />
        )}

        <h2 className="mt-2 font-bold text-lg">{user.username}</h2>
        <p className="text-sm text-gray-500">{user.bio}</p>

        <div className="flex gap-3 mt-2">
          <button
            onClick={handleEditProfile}
            className="flex items-center gap-1 text-cyan-500"
          >
            <Cog6ToothIcon className="w-5 h-5" /> Settings
          </button>

          <button
            onClick={() => navigate('/change-password')}
            className="flex items-center gap-1 text-gray-700"
          >
            Change password
          </button>
        </div>

        {/* ACTION BUTTONS (RESTORED) */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCreatePost}
            className="px-4 py-1 bg-cyan-500 text-white rounded-full"
          >
            + New Post
          </button>
          <button
            onClick={handleCreateCommunity}
            className="px-4 py-1 bg-purple-500 text-white rounded-full"
          >
            + New Community
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-center gap-6 border-y py-3 mb-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-4 py-1 rounded-full text-sm font-medium ${
                activeTab === t.key
                  ? "bg-cyan-500 text-white"
                  : "text-gray-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.title}
            </button>
          );
        })}
      </div>

      {renderTabContent()}

      {/* LOGOUT MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-80 text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <p className="font-semibold mb-4">
                Are you sure you want to logout?
              </p>
              <div className="flex justify-around">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    document.documentElement.classList.remove("dark"); // 🔑 CRITICAL
                    localStorage.clear();
                    navigate("/login");
                  }}

                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
