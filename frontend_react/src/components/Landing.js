import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/home");
      return;
    }

    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-800 to-pink-700 text-white text-xl">
        Loading SnapWire...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">

      {/* Animated gradient blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-500 rounded-full opacity-30 blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-pink-500 rounded-full opacity-30 blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, -80, 0] }}
        transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
      />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:24px_24px] opacity-20" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="relative z-10 text-center max-w-2xl"
      >
        {/* Brand Name */}
        <motion.h1
          initial={{ letterSpacing: "0.2em", opacity: 0 }}
          animate={{ letterSpacing: "0.05em", opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="text-6xl md:text-7xl font-extrabold text-white"
        >
          Snap
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
            Wire
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 mb-12 text-lg md:text-xl text-white/90 italic"
        >
          Post the moment. Play the chat.
        </motion.p>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row justify-center gap-5">
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-4 rounded-2xl bg-white text-indigo-800 font-semibold shadow-2xl hover:bg-indigo-50 transition"
            >
              Get Started
            </motion.button>
          </Link>

          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-4 rounded-2xl bg-white/10 text-white border border-white/20 backdrop-blur-md font-semibold shadow-xl hover:bg-white/20 transition"
            >
              Login
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Bottom glow */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/40 to-transparent"
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ repeat: Infinity, duration: 6 }}
      />
    </div>
  );
}
