import { motion, AnimatePresence } from "framer-motion";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const [post, setPost] = useState(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null);
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
  // small toast for deleted messages (no OK button)
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  const [toastText, setToastText] = useState('');

  const headers = useMemo(() => ({ Authorization: `Token ${token}` }), [token]);
  const location = useLocation();

  const currentUserId = localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')) : null;

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const t = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - t) / 1000); // seconds
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    if (diff < 2419200) return Math.floor(diff / 604800) + 'w ago';
    return t.toLocaleDateString();
  };

  const mediaLooksLikeVideo = (post) => {
    if (!post) return false;
    if (post.media_type === 'video') return true;
    const mf = post.media_file || '';
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(mf);
  };

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const toggleMuted = (e) => { e.stopPropagation(); setMuted((m) => { const next = !m; if (videoRef.current) videoRef.current.muted = next; return next; }); };

  useEffect(() => {
    const fetchPost = async () => {
      const statePost = location.state?.post;
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/get_post_details/${id}/`, { headers });
        setPost(res.data.post);
        setLikes(res.data.post.likes_count || 0);
        setDislikes(res.data.post.dislikes_count || 0);
        setLiked(!!res.data.liked);
        setDisliked(!!res.data.disliked);

        const commentsRes = await axios.get(`http://127.0.0.1:8000/api/get_comment/${id}`, { headers });
        setComments(commentsRes.data);
      } catch (err) {
        if (err.response?.status === 404 && statePost) {
          setPost(statePost);
          setLikes(statePost.likes_count || 0);
          setDislikes(statePost.dislikes_count || 0);
          try {
            const commentsRes = await axios.get(`http://127.0.0.1:8000/api/get_comment/${id}`, { headers });
            setComments(commentsRes.data);
          } catch {}
        } else {
          setError(err.response?.data?.error || "Failed to load post.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError('Invalid post selected.');
      setLoading(false);
      return;
    }

    fetchPost();
  }, [id, token, headers, location.state?.post]);

  const handleLikeDislike = async (action) => {
    if (!token) return alert('Please login to like/dislike');
    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/like_dislike/${id}`,
        { action },
        { headers: { Authorization: `Token ${token}` } }
      );
      setLikes(res.data.likes_count ?? likes);
      setDislikes(res.data.dislikes_count ?? dislikes);
      if (res.data.liked !== undefined) setLiked(!!res.data.liked);
      if (res.data.disliked !== undefined) setDisliked(!!res.data.disliked);
    } catch {
      alert('Could not update like/dislike');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!token) return alert('Please login to comment');
    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/comment/${id}`,
        { text: newComment },
        { headers: { Authorization: `Token ${token}` } }
      );
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
    } catch {
      alert('Failed to add comment');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading post...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">Post not found</div>;

  const reportPost = () => {
    navigate('/report', { state: { contentType: 'post', contentDetails: { id, user: post?.postedby?.name || post?.user_name, date: post?.created_at } } });
    setShowPostMenu(false);
  };

  const reportComment = (comment) => {
    navigate('/report', { state: { contentType: 'comment', contentDetails: { id: comment.id, user: comment.user?.name || comment.user_name, date: comment.created_at } } });
    setActiveCommentMenu(null);
  };

  const deletePostConfirmed = async () => {
    if (!token) return alert('Login required');
    try {
      await axios.delete(`http://127.0.0.1:8000/api/delete_post/${id}`, { headers: { Authorization: `Token ${token}` } });
      // show brief deleted toast and go back
      setToastText('Deleted');
      setShowDeletedToast(true);
      setShowDeletePostConfirm(false);
      setTimeout(() => {
        setShowDeletedToast(false);
        if (window.history.length > 1) navigate(-1);
        else navigate('/home');
      }, 900);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete post');
    } finally {
      setShowDeletePostConfirm(false);
    }
  };

  const deleteCommentConfirmed = async () => {
    if (!token) return alert('Login required');
    try {
      await axios.delete(`http://127.0.0.1:8000/api/delete_comment/${deleteCommentTarget}`, { headers: { Authorization: `Token ${token}` } });
      setComments((prev) => prev.filter((c) => c.id !== deleteCommentTarget));
      setToastText('Deleted');
      setShowDeletedToast(true);
      setTimeout(() => setShowDeletedToast(false), 900);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete comment');
    } finally {
      setShowDeleteCommentConfirm(false);
      setDeleteCommentTarget(null);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">{post.community_name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg my-3"
        >
          {/* Header */}
          <div className="px-5 py-4 flex justify-between items-start">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { const uid = post.postedby?.id; if (uid) navigate(`/userinfo/${uid}`); }}>
              <img src={post.postedby?.profile_pic ? (post.postedby.profile_pic.startsWith('http') ? post.postedby.profile_pic : `http://127.0.0.1:8000${post.postedby.profile_pic}`) : "/default_avatar.svg"} className="w-10 h-10 rounded-full object-cover" alt={post.postedby?.name || 'profile'} />
                <h2 className="font-bold">{post.postedby?.name || post.user_name}</h2>
              </div>


            {/* Menu */}
            <div className="relative">
              <button onClick={() => setShowPostMenu(!showPostMenu)}>
                <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 hover:text-black" />
              </button>
              <AnimatePresence>
                {showPostMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute right-0 top-10 bg-white shadow-xl rounded-xl overflow-hidden z-10">
                    {/* Show Delete only to owner */}
                    {currentUserId && post.postedby && currentUserId === post.postedby.id && (
                      <button onClick={() => { setShowDeletePostConfirm(true); setShowPostMenu(false); }} className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-red-600">Delete post</button>
                    )}
                    {/* Report only for non-owners */}
                    {!(currentUserId && post.postedby && currentUserId === post.postedby.id) && (
                      <button onClick={reportPost} className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-red-500">Report post</button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Media */}
          {post.media_file && (
            mediaLooksLikeVideo(post) ? (
              <div className="relative w-full max-h-[500px] bg-black rounded">
                <video
                  ref={videoRef}
                  src={post.media_file.startsWith('http') ? post.media_file : `http://127.0.0.1:8000${post.media_file}`}
                  className="w-full max-h-[500px] object-contain"
                  playsInline
                  muted={muted}
                  loop
                  onClick={() => {
                    if (!videoRef.current) return;
                    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); } else { videoRef.current.pause(); setIsPlaying(false); }
                  }}
                />

                {/* overlay play/pause */}
                {!isPlaying && (
                  <button
                    onClick={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full p-3"
                    aria-label="Play video"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 5v14l12-7z" fill="white" />
                    </svg>
                  </button>
                )}

                {/* mute/unmute button */}
                <button onClick={toggleMuted} className="absolute right-3 top-3 bg-black/50 text-white p-2 rounded-full z-20" aria-label="Toggle sound on video">
                  {muted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9c1.333 1.333 2 3 2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>

              </div>
            ) : (
              <img
                src={post.media_file.startsWith('http') ? post.media_file : `http://127.0.0.1:8000${post.media_file}`}
                className="w-full max-h-[500px] object-cover"
                alt={post.title || 'post media'}
              />
            )
          )}  

          {/* Caption */}
          <div className="px-5 py-3">
            <p className="text-gray-700 text-sm">{post.caption}</p>
            <p className="text-xs text-gray-400 mt-2">{timeAgo(post.created_at)}</p>
          </div>

          {/* Actions */}
          <div className="px-5 py-3 flex justify-between">
            <div className="flex gap-4">
              <button onClick={() => handleLikeDislike("like")} className={`flex items-center gap-1 ${liked ? 'text-blue-500' : 'text-gray-600'} hover:text-green-600`}>
                <HandThumbUpIcon className="w-5" /> {likes}
              </button>
              <button onClick={() => handleLikeDislike("dislike")} className={`flex items-center gap-1 ${disliked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500`}>
                <HandThumbDownIcon className="w-5" /> {dislikes}
              </button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-gray-600 hover:text-blue-500">
                <ChatBubbleLeftIcon className="w-5" /> Comment
              </button>
              <button className="flex items-center gap-1 text-gray-600 hover:text-purple-500">
                <ShareIcon className="w-5" /> Share
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border-t bg-gray-50 flex flex-col">
                {/* Comment Input */}
                <div className="sticky bottom-0 bg-gray-50 px-5 py-3 flex gap-2 items-center border-t">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-3 py-2 border rounded-lg" />
                  <button onClick={handleAddComment} className="px-3 py-2 bg-blue-500 text-white rounded-lg">Post</button>
                </div>

                {/* Comment List */}
                <div className="flex flex-col">
                  {comments.map((c) => (
                    <div key={c.id} className="px-5 py-3 flex gap-3 items-start relative">
                      <img src={c.user?.profile_pic ? (c.user.profile_pic.startsWith('http') ? c.user.profile_pic : `http://127.0.0.1:8000${c.user.profile_pic}`) : "/default_avatar.svg"} className="w-9 h-9 rounded-full object-cover" alt={c.user?.name || 'commenter'} />
                      <div className="flex-1">
                        <p className="text-sm"><span className="font-semibold">{c.user?.name || c.user_name}</span> {c.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(c.created_at)}</p>
                      </div>
                      <div className="relative">
                        <button onClick={() => setActiveCommentMenu(activeCommentMenu === c.id ? null : c.id)}>
                          <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
                        </button>
                        <AnimatePresence>
                          {activeCommentMenu === c.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute right-0 top-8 bg-white shadow-lg rounded-xl"
                            >
                              {/* Delete for comment owner */}
                              {currentUserId && c.user && currentUserId === c.user.id && (
                                <button
                                  onClick={() => {
                                    setDeleteCommentTarget(c.id);
                                    setShowDeleteCommentConfirm(true);
                                    setActiveCommentMenu(null);
                                  }}
                                  className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                  Delete comment
                                </button>
                              )}

                              {/* Report only for non-owners */}
                              {!(currentUserId && c.user && currentUserId === c.user.id) && (
                                <button
                                  onClick={() => reportComment(c)}
                                  className="px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Report comment
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      {/* Delete confirmation modals */}
      <AnimatePresence>
        {showDeletePostConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setShowDeletePostConfirm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">Delete post?</h3>
                <p className="text-sm text-gray-600 mb-4">This will permanently remove your post. Are you sure?</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowDeletePostConfirm(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                  <button onClick={deletePostConfirmed} className="px-4 py-2 rounded bg-red-500 text-white">Delete</button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showDeleteCommentConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setShowDeleteCommentConfirm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">Delete comment?</h3>
                <p className="text-sm text-gray-600 mb-4">This will permanently remove your comment. Are you sure?</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowDeleteCommentConfirm(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                  <button onClick={deleteCommentConfirmed} className="px-4 py-2 rounded bg-red-500 text-white">Delete</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Deleted toast */}
        <AnimatePresence>
          {showDeletedToast && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-black text-white px-4 py-2 rounded-full">{toastText}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
