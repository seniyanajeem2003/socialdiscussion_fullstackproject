import { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import { motion } from "framer-motion";

export default function Trending() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/trending_posts", {
        headers: token ? { Authorization: `Token ${token}` } : {},
      })
      .then((res) => {
        setPosts(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load trending posts");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading trending posts...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-gray-100 pt-4 pb-2 px-4 border-b border-gray-300">
          <h2 className="text-2xl font-bold">📈 Trending Posts</h2>
          <p className="text-sm text-gray-600 mt-1">
            Explore the posts that are gaining rapid engagement and capturing everyone's attention. Scroll down to see the latest trending content!
          </p>
        </div>

        {/* Trending posts feed */}
        <div className="flex flex-col">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
