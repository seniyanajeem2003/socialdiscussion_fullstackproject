import { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Stream() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    axios
      .get("http://127.0.0.1:8000/api/stream_posts", { headers: { Authorization: `Token ${token}` } })
      .then((res) => {
        setPosts(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load your stream");
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading stream...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm px-6 py-3 border-b border-gray-200">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span role="img" aria-label="stream">🟢</span> Stream
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Stay updated with posts from your communities and followed creators. Scroll down for your personalized feed!
        </p>
      </div>

      {/* Posts Feed */}
      <div className="max-w-3xl mx-auto">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="mb-0"
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
