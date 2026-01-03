import { useState, useRef } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function PostCard({
  post,
  onReport,
  onProfileClick,
  onMediaClick,
  onCommentClick,
  showActions = true,
  showReport = true,
}) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [localCaption, setLocalCaption] = useState(post.caption || "");

  const getFullUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `http://127.0.0.1:8000${path}`;
  };

  const mediaLooksLikeVideo = (post) => {
    if (!post) return false;
    if (post.media_type === "video") return true;
    const mf = post.media_file || "";
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(mf);
  };

  const handleProfile = () => {
    if (onProfileClick) return onProfileClick(post);
    const uid = post.postedby?.id;
    if (uid) navigate(`/userinfo/${uid}`);
  };

  const handleMedia = () => {
    if (onMediaClick) return onMediaClick(post);
    if (!post?.id) return;
    navigate(`/postdetail/${post.id}`, { state: { post } });
  };

  const handleComment = () => {
    if (onCommentClick) return onCommentClick(post);
    if (!post?.id) return;
    navigate(`/postdetail/${post.id}`, { state: { post } });
  };

  const [localLikes, setLocalLikes] = useState(post.likes_count || 0);
  const [localDislikes, setLocalDislikes] = useState(post.dislikes_count || 0);
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [disliked, setDisliked] = useState(Boolean(post.disliked));

  const thumbVideoRef = useRef(null);
  const [thumbMuted, setThumbMuted] = useState(true);
  const toggleThumbMuted = (e) => {
    e.stopPropagation();
    setThumbMuted((m) => {
      if (thumbVideoRef.current) thumbVideoRef.current.muted = !m;
      return !m;
    });
  };

  const currentUserId = localStorage.getItem("user_id")
    ? parseInt(localStorage.getItem("user_id"))
    : null;
  const postOwnerId = post.postedby?.id || post.user_id || null;

  const doAction = async (action) => {
    if (loadingAction) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/like_dislike/${post.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error();

      setLocalLikes(data.likes_count);
      setLocalDislikes(data.dislikes_count);
      setLiked(data.liked);
      setDisliked(data.disliked);
    } catch {
      alert("Could not update reaction");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* HEADER */}
      <div className="flex items-center justify-between px-3 py-2">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleProfile}
        >
          <img
            src={
              getFullUrl(post.postedby?.profile_pic) ||
              "https://via.placeholder.com/150"
            }
            className="w-8 h-8 rounded-full object-cover"
            alt="profile"
          />
          <p className="text-sm font-semibold">
            {post.postedby?.name || post.user_name}
          </p>
        </div>

        {(showReport || currentUserId === postOwnerId) && (
          <div className="relative">
            <button onClick={() => setOpenMenu(!openMenu)}>
              <EllipsisVerticalIcon className="w-5 text-gray-600" />
            </button>

            {openMenu && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 shadow rounded-lg z-10">
                {currentUserId === postOwnerId && (
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      setShowEditModal(true);
                    }}
                    className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    Edit caption
                  </button>
                )}
                {currentUserId !== postOwnerId && (
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      onReport?.(post.id);
                    }}
                    className="px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    Report post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MEDIA */}
      {post.media_file && (
        <div className="w-full bg-black" onClick={handleMedia}>
          {mediaLooksLikeVideo(post) ? (
            <div className="relative">
              <video
                ref={thumbVideoRef}
                src={getFullUrl(post.media_file)}
                className="w-full max-h-[520px] object-contain"
                muted={thumbMuted}
                playsInline
                loop
                autoPlay
              />
              <button
                onClick={toggleThumbMuted}
                className="absolute right-2 bottom-2 bg-black/50 text-white p-1 rounded-full z-20"
              >
                🔊
              </button>
            </div>
          ) : (
            <img
              src={getFullUrl(post.media_file)}
              className="w-full max-h-[520px] object-contain"
              alt="post"
            />
          )}
        </div>
      )}

      {/* ACTIONS */}
      {showActions && (
        <div className="flex justify-between items-center px-3 py-2">
          <div className="flex gap-5 items-center">
            <button onClick={() => doAction("like")} className="flex gap-1">
              <HandThumbUpIcon
                className={`w-5 ${
                  liked ? "text-blue-500" : "text-gray-700"
                }`}
              />
              <span className="text-sm">{localLikes}</span>
            </button>

            <button onClick={() => doAction("dislike")} className="flex gap-1">
              <HandThumbDownIcon
                className={`w-5 ${
                  disliked ? "text-red-500" : "text-gray-700"
                }`}
              />
              <span className="text-sm">{localDislikes}</span>
            </button>

            <button onClick={handleComment} className="flex gap-1">
              <ChatBubbleLeftIcon className="w-5 text-gray-700" />
              <span className="text-sm">
                {post.comments_count || 0}
              </span>
            </button>
          </div>

          <ShareIcon className="w-5 text-gray-700 cursor-pointer" />
        </div>
      )}

      {/* CAPTION */}
      {localCaption && (
        <div className="px-3 pb-3 text-sm text-gray-800 dark:text-gray-200">
          {localCaption}
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Edit caption</h3>

            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              rows={3}
            />

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
                  if (!token) return;

                  const form = new FormData();
                  form.append("caption", editCaption);

                  const res = await fetch(
                    `http://127.0.0.1:8000/api/edit_post/${post.id}/`,
                    {
                      method: "PATCH",
                      headers: { Authorization: `Token ${token}` },
                      body: form,
                    }
                  );

                  if (!res.ok) {
                    alert("Failed to update caption");
                    return;
                  }

                  setLocalCaption(editCaption);
                  setShowEditModal(false);
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
