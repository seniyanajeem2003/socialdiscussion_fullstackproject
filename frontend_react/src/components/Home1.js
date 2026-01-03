import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  FireIcon,
  Squares2X2Icon,
  UsersIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import PostCard from "./PostCard";
import { useNavigate } from "react-router-dom";

export default function Home1() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem("token");

  const getFullImageUrl = (imgPath) => {
    if (!imgPath) return "https://randomuser.me/api/portraits/women/65.jpg";
    return imgPath.startsWith("http")
      ? imgPath
      : `http://127.0.0.1:8000${imgPath}`;
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/profile_dashboard", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        if (res.data?.user?.id)
          localStorage.setItem("user_id", String(res.data.user.id));
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));

    axios
      .get("http://127.0.0.1:8000/api/latest_post", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => setPosts(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate, token]);

  useEffect(() => {
    // Initialize filtered posts when posts are loaded
    setFilteredPosts(posts || []);
  }, [posts]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) {
        setFilteredPosts(posts);
        return;
      }
      const filtered = (posts || []).filter((p) => {
        const title = (p.title || "").toLowerCase();
        const caption = (p.caption || "").toLowerCase();
        const author = (p.postedby?.name || p.user_name || "").toLowerCase();
        const community = (p.community_name || (p.community && p.community.name) || "").toLowerCase();
        return (
          title.includes(q) ||
          caption.includes(q) ||
          author.includes(q) ||
          community.includes(q)
        );
      });
      setFilteredPosts(filtered);
    }, 250);
    return () => clearTimeout(id);
  }, [searchQuery, posts]);

  const handleProfile = () => navigate("/userprofile");

  const handleReportPost = (postId) => {
    const post = posts.find((p) => p.id === postId);
    navigate("/report", {
      state: {
        contentType: "post",
        contentDetails: {
          id: postId,
          user: post?.postedby?.name || post.user_name,
          date: post?.created_at,
        },
      },
    });
  };

  const mainMiniCards = [
    {
      title: "Stream",
      icon: Squares2X2Icon,
      bgImage:
        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
    },
    {
      title: "Trending",
      icon: ArrowTrendingUpIcon,
      bgImage:
        "https://images.unsplash.com/photo-1557683316-973673baf926",
    },
    {
      title: "Popular",
      icon: FireIcon,
      bgImage:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad",
    },
    {
      title: "Discover",
      icon: UsersIcon,
      bgImage:
        "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7",
    },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-6 py-4 bg-white sticky top-0 z-30 shadow-sm">
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={handleProfile}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src={getFullImageUrl(user?.profile_pic)}
            alt={user?.name}
            className="w-10 h-10 rounded-full border-2 border-cyan-500"
          />
          <p className="font-semibold">{user?.name}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.1 }}
          onClick={() => navigate("/messagefeed")}
          className="cursor-pointer"
        >
          <ChatBubbleLeftEllipsisIcon className="w-8 h-8" />
        </motion.div>
      </div>

      {/* SEARCH */}
      <div className="px-6 mt-6">
        <div className="relative max-w-2xl mx-auto">
          <MagnifyingGlassIcon className="w-6 h-6 absolute left-3 top-4 text-gray-500" />
          <input
            placeholder="Search posts, users, communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full py-4 rounded-xl shadow bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="px-6 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {mainMiniCards.map((card) => {
          const Icon = card.icon;
          const handleClick = () => {
            if (card.title === "Discover") navigate("/discovercomm");
            if (card.title === "Popular") navigate("/popular");
            if (card.title === "Trending") navigate("/trending");
            if (card.title === "Stream") navigate("/stream");
          };

          return (
            <motion.div
              key={card.title}
              whileHover={{ scale: 1.05 }}
              className="relative h-36 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
              onClick={handleClick}
            >
              <img
                src={card.bgImage}
                className="w-full h-full object-cover"
                alt={card.title}
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                <Icon className="w-7 h-7 mb-1" />
                <p className="font-semibold text-sm">{card.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LATEST POSTS — INSTAGRAM STYLE */}
      <div className="mt-10">
        <h2 className="text-xl font-bold px-6 mb-3">Latest Posts</h2>

        {/* IMPORTANT PART */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 dark:text-white">
          {filteredPosts.length === 0 && searchQuery ? (
            <div className="p-6 text-center text-gray-500">No results found for "{searchQuery}"</div>
          ) : (
            filteredPosts.map((post, index) => (
              <div key={post.id} className={index !== filteredPosts.length - 1 ? "border-b" : ""}>
                <PostCard post={post} onReport={handleReportPost} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* FLOATING ADD BUTTON */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center text-white z-50"
        onClick={() => setIsModalOpen(true)}
      >
        <PlusIcon className="w-7 h-7" />
      </motion.button>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="fixed bottom-20 right-6 z-50 bg-white rounded-xl shadow-xl p-6 w-64"
            >
              <h3 className="text-lg font-bold mb-4">Create</h3>
              <button
                onClick={() => navigate("/createcomm")}
                className="w-full mb-3 px-4 py-2 bg-cyan-500 text-white rounded-xl"
              >
                Create Community
              </button>
              <button
                onClick={() => navigate("/newpost")}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-xl"
              >
                Create Post
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
