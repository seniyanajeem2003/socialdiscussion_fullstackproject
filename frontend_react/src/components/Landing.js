import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If already logged in, redirect
    if (token) {
      navigate("/home");
      return;
    }

    // Example API call (optional)
    axios
      .get("http://127.0.0.1:8000/api/latest_post")
      .then(() => {
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4 relative overflow-hidden">

      {/* Floating animated circles */}
      <motion.div
        className="absolute top-10 left-10 w-40 h-40 bg-purple-400 rounded-full opacity-30"
        animate={{ y: [0, 20, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-60 h-60 bg-pink-400 rounded-full opacity-30"
        animate={{ y: [0, -20, 0], x: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center z-10"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Join the Conversation
        </h1>

        <p className="text-white text-lg md:text-xl mb-8">
          Explore communities, share ideas, and start meaningful discussions.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-50 transition"
            >
              Sign Up
            </motion.button>
          </Link>

          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition"
            >
              Login
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Footer Illustration */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-48 bg-white/10 backdrop-blur-sm rounded-t-3xl"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />
    </div>
  );
}
