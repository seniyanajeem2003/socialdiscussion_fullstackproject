import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function DiscoverCommunity() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // default: recently created first
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token"); // get token from localStorage
  const currentUserId = localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null;
  const navigate = useNavigate();

  const getFullImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/600x400?text=Community";
    return path.startsWith("http") ? path : `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    if (!token) return; // If no token, you can redirect to login page

    axios
      .get("http://127.0.0.1:8000/api/discover_communities", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => {
        setCommunities(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load communities");
        setLoading(false);
      });
  }, [token]);

  const handleJoinLeave = (communityId) => {
    if (!token) return; // prevent action if no token

    axios
      .post(
        `http://127.0.0.1:8000/api/toggle_membership/${communityId}`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      )
      .then((res) => {
        // Update local state to reflect join/leave
        setCommunities(
          communities.map((c) =>
            c.id === communityId ? { ...c, joined: !c.joined } : c
          )
        );
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to update membership");
      });
  };

  const filteredCommunities = communities
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "members") return (b.members || 0) - (a.members || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // recent
      const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bd - ad;
    });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading communities...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:bg-gray-900 px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <h1 className="text-3xl font-bold text-gray-800">
            Discover Communities
          </h1>
        </div>

        {/* Search & Sort */}
        <div className="flex gap-4 flex-wrap w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <MagnifyingGlassIcon className="w-5 h-5 absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full border rounded-xl py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-xl py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="recent">Recently Created</option>
            <option value="members">Most Members</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCommunities.map((community) => (
          <motion.div
            key={community.id}
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate(`/community/${community.id}`)}
            className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col transition cursor-pointer hover:shadow-2xl"
          >
            <div
              className="h-40 w-full bg-cover bg-center relative"
              style={{
                backgroundImage: `url(${getFullImageUrl(
                  community.thumbnail || community.image
                )})`,
              }}
            >
              <div className="absolute left-4 bottom-[-20px]">
                <img
                  src={getFullImageUrl(
                    community.thumbnail || community.image
                  )}
                  alt={community.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/community/${community.id}`);
                  }}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md cursor-pointer"
                />
              </div>
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <UserGroupIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1 pt-8">
              <h2
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/community/${community.id}`);
                }}
                className="text-xl font-bold text-gray-800 mb-2 cursor-pointer"
              >
                {community.name}
              </h2>
              <p className="text-gray-600 mb-4 flex-1">
                {community.description}
              </p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-gray-500 font-semibold">
                  {community.members} Members
                </span>
                {community.creater?.id !== currentUserId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinLeave(community.id);
                    }}
                    className={`px-4 py-2 rounded-full font-semibold transition ${
                      community.joined
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-cyan-500 text-white hover:bg-cyan-600"
                    }`}
                  >
                    {community.joined ? "Leave" : "Join"}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
