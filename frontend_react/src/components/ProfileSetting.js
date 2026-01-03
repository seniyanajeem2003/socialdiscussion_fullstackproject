import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({
    name: "",
    email: "",
    bio: "",
    password: "",
    profilePic: "",
  });

  const [newProfilePic, setNewProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     GET PROFILE
  ========================== */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/profile", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((res) => {
        setUser({
          name: res.data.name,
          email: res.data.email,
          bio: res.data.bio || "",
          password: "",
          profilePic: res.data.profile_pic ? (res.data.profile_pic.startsWith('http') ? res.data.profile_pic : `http://127.0.0.1:8000${res.data.profile_pic}`) : "",
        });
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load profile");
      });
  }, [token, navigate]);

  /* =========================
     PROFILE IMAGE CHANGE
  ========================== */
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewProfilePic(file);
    setUser((prev) => ({
      ...prev,
      profilePic: URL.createObjectURL(file),
    }));
  };

  /* =========================
     SAVE PROFILE
  ========================== */
  const handleSave = async () => {
    setLoading(true);

    try {
      /* -------- Update profile details -------- */
      const payload = {
        name: user.name,
        bio: user.bio,
      };

      if (user.password) {
        payload.password = user.password;
      }

      await axios.post(
        "http://127.0.0.1:8000/api/update_profile",
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      /* -------- Update profile picture -------- */
      if (newProfilePic) {
        const imgData = new FormData();
        imgData.append("profile_pic", newProfilePic);

        await axios.post(
          "http://127.0.0.1:8000/api/profile_picture_update",
          imgData,
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      alert("Profile updated successfully");
      navigate("/userprofile");
    } catch (err) {
      console.error(err);
      alert("Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-xl p-8"
      >
        <button
          onClick={() => navigate("/userprofile")}
          className="flex items-center gap-2 text-cyan-600 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">
          Profile Settings
        </h2>

        {/* Profile Image */}
        <div className="relative flex justify-center mb-6">
          {user.profilePic ? (
            <img
              src={user.profilePic}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-cyan-400"
            />
          ) : (
            <UserCircleIcon className="w-32 h-32 text-gray-400" />
          )}

          <label className="absolute bottom-1 right-[38%] bg-cyan-500 p-2 rounded-full cursor-pointer">
            <PhotoIcon className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            value={user.name}
            onChange={(e) =>
              setUser({ ...user, name: e.target.value })
            }
            placeholder="Name"
            className="w-full border rounded-xl p-3"
          />

          <input
            value={user.email}
            disabled
            className="w-full border rounded-xl p-3 bg-gray-100 cursor-not-allowed"
          />


          <textarea
            value={user.bio}
            onChange={(e) =>
              setUser({ ...user, bio: e.target.value })
            }
            placeholder="Bio"
            rows="3"
            className="w-full border rounded-xl p-3 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full mt-6 bg-cyan-500 text-white py-3 rounded-xl font-semibold"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </motion.div>
    </div>
  );
}
