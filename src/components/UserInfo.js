import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function UserInfo() {
  const { id } = useParams(); // User ID from URL
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [showPicModal, setShowPicModal] = useState(false);

  const token = localStorage.getItem("token");
  const loggedInUserId = Number(localStorage.getItem("user_id"));
  const numericId = Number(id);

  const getFullImageUrl = (p) => {
    if (!p) return '/default_avatar.svg';
    return p.startsWith('http') ? p : `http://127.0.0.1:8000${p}`;
  };

  const fetchUser = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Validate id param is a number
    if (Number.isNaN(numericId)) {
      console.warn('Invalid user id in URL:', id);
      setError('Invalid user selected.');
      setLoading(false);
      return;
    }

    try {
      // Get user profile
      const profileRes = await axios.get(
        `http://127.0.0.1:8000/api/user_profile/${numericId}/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      const fetchedUser = profileRes.data;
      // If backend returns a relative media path, prefix it with the server URL so the image loads
      if (fetchedUser.profile_pic && !fetchedUser.profile_pic.startsWith('http')) {
        fetchedUser.profile_pic = `http://127.0.0.1:8000${fetchedUser.profile_pic}`;
      }
      setUser(fetchedUser);

          // Try to get user's posts and created communities (backend endpoints may not exist on older versions)
      try {
        const postsRes = await axios.get(`http://127.0.0.1:8000/api/user_posts/${numericId}/`, { headers: { Authorization: `Token ${token}` } });
        setUserPosts(postsRes.data || []);
      } catch (e) {
        // ignore if endpoint not available
        setUserPosts([]);
      }

      try {
        const commRes = await axios.get(`http://127.0.0.1:8000/api/user_communities/${numericId}/`, { headers: { Authorization: `Token ${token}` } });
        setUserCommunities(commRes.data || []);
      } catch (e) {
        setUserCommunities([]);
      }

      // Only fetch follow/block status if not own profile and we know our user id
      if (!Number.isNaN(loggedInUserId) && numericId !== loggedInUserId) {
        try {
          const followRes = await axios.get(`http://127.0.0.1:8000/api/follow/${numericId}`, {
            headers: { Authorization: `Token ${token}` },
          });
          setFollowing(followRes.data.following);
        } catch (err) {
          if (err.response?.status === 400) {
            console.warn('Follow status returned 400; likely viewing yourself:', err.response.data);
            setFollowing(false);
          } else {
            console.error('Failed to fetch follow status:', err);
          }
        }

        try {
          const blockRes = await axios.get(`http://127.0.0.1:8000/api/block/${numericId}`, {
            headers: { Authorization: `Token ${token}` },
          });
          setBlocked(blockRes.data.blocked);
        } catch (err) {
          if (err.response?.status === 400) {
            console.warn('Block status returned 400; likely viewing yourself:', err.response.data);
            setBlocked(false);
          } else {
            console.error('Failed to fetch block status:', err);
          }
        }
      } else {
        setFollowing(false);
        setBlocked(false);
      }
      // Clear any previous errors on success
      setError("");
    } catch (err) {
      console.error('UserInfo fetch error:', err);
      // Try to show server-provided error or fallback to message
      const serverMsg = err.response?.data?.error || err.response?.data?.detail || err.message;
      if (err.response?.status === 404) setError(serverMsg || "User not found.");
      else if (err.response?.status === 401) {
        setError(serverMsg || "Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else setError(serverMsg || "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate, numericId, loggedInUserId]);

  useEffect(() => {
    // trigger initial load
    setLoading(true);
    fetchUser();
  }, [fetchUser]);

  const handleFollow = async () => {
    // Prevent following yourself
    if (!Number.isNaN(loggedInUserId) && numericId === loggedInUserId) {
      console.warn('Attempt to follow yourself blocked');
      return;
    }

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/follow/${numericId}`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowing(res.data.following);
      setUser((prev) => ({
        ...prev,
        followers_count: res.data.followers_count,
      }));
    } catch (err) {
      console.error(err);
    }
  }; 

  const handleBlock = async () => {
    // Prevent blocking yourself
    if (!Number.isNaN(loggedInUserId) && numericId === loggedInUserId) {
      console.warn('Attempt to block yourself blocked');
      return;
    }

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/block/${numericId}`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setBlocked(res.data.blocked);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return <p className="text-center mt-10">Loading user info...</p>;
  if (error)
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => { setLoading(true); setError(''); fetchUser(); }} className="px-4 py-2 bg-white border rounded">Retry</button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">Go Back</button>
          <button onClick={() => navigate('/home')} className="px-4 py-2 bg-cyan-500 text-white rounded">Home</button>
        </div>
      </div>
    );
  if (!user) return <p className="text-center mt-10">User not found.</p>;

  const isOwnProfile = !Number.isNaN(loggedInUserId) && numericId === loggedInUserId;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-6">
        <img
          src={user.profile_pic || "/default_avatar.svg"}
          alt={user.name}
          className="w-24 h-24 rounded-full mb-2 object-cover cursor-pointer"
          onClick={() => setShowPicModal(true)}
        />

        {/* small profile pic popup */}
        {showPicModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPicModal(false)}>
            <div className="bg-white rounded-lg p-3 shadow" onClick={(e) => e.stopPropagation()}>
              <img src={user.profile_pic || "/default_avatar.svg"} alt={user.name} className="w-48 h-48 object-cover rounded" />
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold">{user.name}</h1>

        <p className="text-gray-600 text-sm">{user.bio}</p>

        <div className="flex gap-4 mt-2 text-sm text-gray-700">
          <span>{user.followers_count} Followers</span>
          <span>{user.following_count} Following</span>
        </div>

        {!isOwnProfile && (
          <div className="flex gap-3 mt-4">
            {!blocked && (
              <button
                onClick={handleFollow}
                className="px-4 py-2 bg-cyan-500 text-white rounded-full"
              >
                {following ? "Unfollow" : "Follow"}
              </button>
            )}

            {!blocked && (
              <button
                onClick={() => navigate(`/messagefeed/${user.id}`, { state: { focus: true } })}
                className="px-4 py-2 bg-blue-500 text-white rounded-full"
              >
                Message
              </button>
            )}

            <button
              onClick={() => setShowBlockModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-full"
            >
              {blocked ? "Unblock" : "Block"}
            </button>

            {/* Block confirmation modal */}
            {showBlockModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-80 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Block user?</h3>
                  <p className="text-sm text-gray-500 mb-4">Are you sure you want to {blocked ? 'unblock' : 'block'} {user.name}?</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowBlockModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                    <button onClick={async () => { setShowBlockModal(false); await handleBlock(); }} className="px-4 py-2 bg-red-500 text-white rounded-lg">Yes</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {blocked && (
        <p className="text-center text-red-500 font-semibold">
          You have blocked this user
        </p>
      )}

      {/* Tabs: Posts & Communities (Instagram style) */}
      <div className="mt-6 bg-white rounded-xl shadow p-2">
        <div className="flex justify-around border-b pb-2">
          <button onClick={() => setActiveTab('posts')} className={`py-2 px-4 rounded ${activeTab === 'posts' ? 'bg-gray-100 font-semibold' : 'text-gray-500'}`}>
            Posts ({userPosts.length})
          </button>
          <button onClick={() => setActiveTab('communities')} className={`py-2 px-4 rounded ${activeTab === 'communities' ? 'bg-gray-100 font-semibold' : 'text-gray-500'}`}>
            Communities ({userCommunities.length})
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'communities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userCommunities.length === 0 && <p className="text-center text-gray-400">No communities</p>}
              {userCommunities.map((c) => (
                <div key={c.id} className="p-3 bg-white rounded shadow cursor-pointer" onClick={() => navigate(`/community/${c.id}`)}>
                  <div className="flex items-center gap-3">
                    <img src={getFullImageUrl(c.thumbnail)} alt={c.name} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.members || c.member_count || ''} members</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-2">
              {userPosts.length === 0 && <p className="text-center text-gray-400">No posts</p>}
              {userPosts.map((p) => (
                <div key={p.id} className="aspect-square bg-gray-200 cursor-pointer" onClick={() => navigate(`/postdetail/${p.id}`)}>
                  {p.media_file ? (
                    (p.media_type === 'video' || /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(p.media_file)) ? (
                      <video
                        src={p.media_file.startsWith('http') ? p.media_file : `http://127.0.0.1:8000${p.media_file}`}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <img src={p.media_file.startsWith('http') ? p.media_file : `http://127.0.0.1:8000${p.media_file}`} alt={`post ${p.id}`} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <img src={'https://via.placeholder.com/200'} alt={`post ${p.id}`} className="w-full h-full object-cover" />
                  )} 
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
