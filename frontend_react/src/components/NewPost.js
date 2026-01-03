import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon, PhotoIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function CreatePost() {
  const navigate = useNavigate();
  const { state, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const initialCommunityId =
    state?.community_id ||
    (searchParams.get("community") ? Number(searchParams.get("community")) : null);

  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handlePost = async () => {
    if (!token) {
      alert("You must be logged in!");
      return;
    }

    if (!caption && !media) {
      alert("Please add a caption or media!");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    if (media) formData.append("media_file", media);

    // ✅ FIX: backend expects "community", not "community_id"
    if (initialCommunityId) {
      formData.append("community", initialCommunityId);
    }

    setLoading(true);
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/create_posts",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${token}`,
          },
        }
      );

      alert("Post created successfully!");

      if (initialCommunityId) navigate(`/community/${initialCommunityId}`);
      else navigate("/home");
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-700 mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back
      </button>

      <motion.div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-1">Create Post</h1>

        <textarea
          rows="4"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border rounded-xl px-4 py-2 mb-4"
        />

        <label className="flex items-center gap-3 cursor-pointer border rounded-xl px-4 py-3 mb-4">
          {media?.type?.startsWith("video") ? (
            <VideoCameraIcon className="w-6 h-6" />
          ) : (
            <PhotoIcon className="w-6 h-6" />
          )}
          <span>{media ? media.name : "Upload image or video"}</span>
          <input
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => setMedia(e.target.files[0])}
          />
        </label>

        {media && (
          <div className="mb-4">
            {media.type.startsWith("image") ? (
              <img
                src={URL.createObjectURL(media)}
                alt="Post preview"
                className="w-full h-64 object-cover"
              />

            ) : (
              <video controls src={URL.createObjectURL(media)} className="w-full h-64" />
            )}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handlePost}
          disabled={loading}
          className="w-full bg-cyan-500 text-white py-3 rounded-xl"
        >
          {loading ? "Posting..." : "Post"}
        </motion.button>
      </motion.div>
    </div>
  );
}
