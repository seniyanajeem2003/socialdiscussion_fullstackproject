import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Password match check
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/signup",
        {
          name: form.name,       // ✅ backend expects "name"
          email: form.email,
          password: form.password,
        }
      );

      navigate("/login");

    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const floatingLabel =
    "absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all " +
    "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base " +
    "peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 " +
    "peer-focus:text-sm peer-focus:text-indigo-600";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
      >
        <h1 className="text-3xl font-bold text-center mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Join communities. Share ideas. Start discussions.
        </p>

        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div className="relative">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder=" "
              className="peer w-full border rounded-xl px-3 pt-4 pb-3"
            />
            <label className={floatingLabel}>Name</label>
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder=" "
              className="peer w-full border rounded-xl px-3 pt-4 pb-3"
            />
            <label className={floatingLabel}>Email</label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder=" "
              className="peer w-full border rounded-xl px-3 pt-4 pb-3"
            />
            <label className={floatingLabel}>Password</label>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder=" "
              className="peer w-full border rounded-xl px-3 pt-4 pb-3"
            />
            <label className={floatingLabel}>Confirm Password</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </motion.div>
    </div>
  );
}
