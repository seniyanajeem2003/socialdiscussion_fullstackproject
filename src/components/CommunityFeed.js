import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PostCard from "./PostCard";
import { PlusIcon } from "@heroicons/react/24/solid";


export default function CommunityFeed() {
  const navigate = useNavigate();
  const { id } = useParams(); // community_id

  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Token ${token}` },
  };

  const [community, setCommunity] = useState(null);
  const [joined, setJoined] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeComments, setActiveComments] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThumbnail, setEditThumbnail] = useState(null);

  const getFullImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/600x400?text=Community";
    return path.startsWith("http") ? path : `http://127.0.0.1:8000${path}`;
  };

  /* ---------------- LOAD COMMUNITY ---------------- */
  useEffect(() => {
    const tokenLocal = localStorage.getItem("token");
    const headers = tokenLocal ? { headers: { Authorization: `Token ${tokenLocal}` } } : {};
    axios
      .get(`http://127.0.0.1:8000/api/community/${id}`, headers)
      .then((res) => {
        setCommunity(res.data.community);
        setJoined(res.data.joined);
      })
      .catch(console.error);
  }, [id]);

  /* ---------------- LOAD COMMUNITY POSTS ---------------- */
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/community_posts/${id}`)
      .then((res) => setPosts(res.data))
      .catch(console.error);
  }, [id]);

  /* ---------------- JOIN / LEAVE ---------------- */
  const toggleJoin = () => {
    axios
      .post(
        `http://127.0.0.1:8000/api/toggle_membership/${id}`,
        {},
        authHeader
      )
      .then((res) => setJoined(res.data.joined))
      .catch(console.error);
  };

  /* ---------------- ADD COMMENT ---------------- */
  const addComment = (postId) => {
    if (!commentInput.trim()) return;
    axios
      .post(
        `http://127.0.0.1:8000/api/comment/${postId}`,
        { text: commentInput },
        authHeader
      )
      .then(() => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, comments_count: p.comments_count + 1 }
              : p
          )
        );
        setCommentInput("");
      })
      .catch(console.error);
  };

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

  if (!community) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* COMMUNITY HEADER */}
      <motion.div className="relative mx-4 rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={getFullImageUrl(community.thumbnail)}
          className="w-full h-56 object-cover"
          alt={community.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-start text-white flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold">{community.name}</h1>
            <p className="text-sm text-gray-200 mt-1 line-clamp-2">
              {community.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {community.creater?.id !== Number(localStorage.getItem('user_id')) && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleJoin}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold ${
                  joined
                    ? "bg-white/20 border border-white/40 text-white"
                    : "bg-cyan-500 text-white"
                }`}
              >
                {joined ? "Leave" : "Join"}
              </motion.button>
            )}

            {community.creater?.id === Number(localStorage.getItem("user_id")) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditName(community.name);
                  setEditDescription(community.description || "");
                  setShowEditModal(true);
                }}
                className="px-4 py-2 bg-white/20 border border-white/40 rounded-full text-sm font-semibold"
              >
                Edit
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="h-4" />

      {/* POSTS */}
      <div className="max-w-3xl mx-auto">
        {posts.map((post) => (
          <div key={post.id}>
            <PostCard
              post={post}
              onReport={handleReportPost}
              onProfileClick={(p) => {
                const uid = p.postedby?.id;
                if (uid) navigate(`/userinfo/${uid}`);
              }}
              onCommentClick={() =>
                setActiveComments(activeComments === post.id ? null : post.id)
              }
            />

            {activeComments === post.id && (
              <div className="border-t bg-gray-50 px-4 py-3 flex gap-2">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 outline-none"
                />
                <button
                  onClick={() => addComment(post.id)}
                  className="text-cyan-600 font-semibold"
                >
                  Post
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FLOATING ADD BUTTON */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-cyan-500 text-white
          flex items-center justify-center
          shadow-lg hover:bg-cyan-600
        "
        onClick={() => navigate('/newpost', { state: { community_id: community.id } })}
      >
        <PlusIcon className="w-7 h-7" />
      </motion.button>

      {/* EDIT COMMUNITY MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Edit Community</h3>
            <p className="text-sm text-gray-500 mb-4">
              Update the community name or thumbnail
            </p>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border rounded p-2 mb-3"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full border rounded p-2 mb-3"
              rows={3}
            />

            <label className="flex items-center gap-3 cursor-pointer border rounded px-3 py-2 mb-3">
              <span className="text-sm text-gray-600">
                {editThumbnail ? editThumbnail.name : "Change thumbnail (optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setEditThumbnail(e.target.files[0])}
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  const form = new FormData();
                  form.append("name", editName);
                  form.append("description", editDescription);
                  if (editThumbnail) form.append("thumbnail", editThumbnail);

                  try {
                    let res = await fetch(
                      `http://127.0.0.1:8000/api/update_community/${community.id}/`,
                      {
                        method: "PATCH",
                        headers: { Authorization: `Token ${token}` },
                        body: form,
                      }
                    );

                    if (!res.ok) throw new Error("Failed");
                    alert("Community updated");
                    window.location.reload();
                  } catch {
                    alert("Failed to update community");
                  }
                }}
                className="px-4 py-2 bg-cyan-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
