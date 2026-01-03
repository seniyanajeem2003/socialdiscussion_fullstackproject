import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";

export default function Popular() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/popular_posts", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => setPosts(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load popular posts");
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading popular posts...
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
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-100 z-20 px-6 py-4 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          🔥 Popular Posts
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Discover the most loved and trending posts!
        </p>
      </div>

      {/* Posts Feed */}
      <div className="max-w-3xl mx-auto mt-4">
        {posts.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="relative"
          >
            <PostCard
              post={post}
              onReport={handleReportPost}
              onProfileClick={(p) => {
                const uid = p.postedby?.id;
                if (uid) navigate(`/userinfo/${uid}`);
              }}
              onCommentClick={() =>
                navigate(`/postdetail/${post.id}`, { state: { post } })
              }
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
