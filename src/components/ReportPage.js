import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReportForm() {
  const location = useLocation();
  const navigate = useNavigate();

  // Passed from previous page
  const { contentType, contentDetails } = location.state || {};

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Auto date
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contentType || !contentDetails?.id) {
      alert("Invalid report data");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://127.0.0.1:8000/api/submit_report",
        {
          content_type: contentType,     // post | comment | message
          object_id: contentDetails.id,  // ID of post/comment/message
          reason: reason,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      alert("Report submitted successfully ✅");
      navigate('/messagefeed'); // go to messages page
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Report {contentType?.charAt(0).toUpperCase() + contentType?.slice(1)}
        </h2>

        {/* Auto-filled preview */}
        <div className="mb-4 space-y-1 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Content Type:</span> {contentType}
          </p>
          <p>
            <span className="font-semibold">ID:</span> {contentDetails?.id}
          </p>
          <p>
            <span className="font-semibold">User:</span> {contentDetails?.user}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {today}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you are reporting this content"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 text-white font-semibold py-2 rounded-xl hover:bg-cyan-600 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
