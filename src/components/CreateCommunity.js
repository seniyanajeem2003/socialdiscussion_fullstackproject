import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon, PhotoIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateCommunity() {
  const navigate = useNavigate();

  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [createPost, setCreatePost] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [postMedia, setPostMedia] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleSubmit = async () => {
    if (!token) {
      alert("You must be logged in!");
      return;
    }

    if (!communityName || !description) {
      alert("Community name and description are required!");
      return;
    }

    const formData = new FormData();
    formData.append("name", communityName);
    formData.append("description", description);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    if (createPost) {
      // signal backend to create the initial post with the community
      formData.append("create_post", "true");
      formData.append("post_caption", postCaption);
      if (postMedia) formData.append("post_media", postMedia);
    }

    setLoading(true);
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/create_communities",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${token}`,
          },
        }
      );
      alert("Community created successfully!");
      navigate("/home"); // redirect to home page
    } catch (err) {
      console.error(err);
      alert("Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-700 hover:text-black transition mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back
      </button>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Create a Community</h1>
        <p className="text-sm text-gray-500 mb-6">Build a space where people can connect and share ideas</p>

        {/* Community Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Community Name</label>
          <input
            type="text"
            placeholder="Enter community name"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            rows="3"
            placeholder="Describe what your community is about"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Community Thumbnail</label>
          <label className="flex items-center gap-3 cursor-pointer border rounded-xl px-4 py-3 hover:bg-gray-50 transition">
            <PhotoIcon className="w-6 h-6 text-gray-500" />
            <span className="text-gray-600 text-sm">{thumbnail ? thumbnail.name : "Upload an image"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </label>
        </div>

        {/* Create First Post Toggle */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            id="createPost"
            checked={createPost}
            onChange={() => setCreatePost(!createPost)}
            className="w-4 h-4 accent-cyan-500"
          />
          <label htmlFor="createPost" className="text-sm font-medium">
            Create a first post for this community
          </label>
        </div>

        {/* Post Creation Section */}
        {createPost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border rounded-2xl p-4 mb-6 bg-gray-50"
          >
            <h2 className="font-semibold text-gray-700 mb-3">First Post Details</h2>

            {/* Caption */}
            <textarea
              rows="3"
              placeholder="Write something for your first post..."
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />

            {/* Media Upload */}
            <label className="flex items-center gap-3 cursor-pointer border rounded-xl px-4 py-3 hover:bg-white transition">
              <VideoCameraIcon className="w-6 h-6 text-gray-500" />
              <span className="text-gray-600 text-sm">{postMedia ? postMedia.name : "Add image or video"}</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setPostMedia(e.target.files[0])}
              />
            </label>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-xl hover:bg-cyan-600 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Community"}
        </motion.button>
      </motion.div>
    </div>
  );
}
