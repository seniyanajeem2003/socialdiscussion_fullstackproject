import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./components/Landing";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Home from "./components/Home1";
import UserProfile from "./components/UserProfile";
import ProfileSetting from "./components/ProfileSetting";
import DiscoverComm from "./components/DiscoverComm";
import CommunityFeed from "./components/CommunityFeed";
import PostDetail from "./components/PostDetail";
import CreateCommunity from "./components/CreateCommunity";
import NewPost from "./components/NewPost";
import UserInfo from "./components/UserInfo";
import ReportPage from "./components/ReportPage";
import ChatsPage from "./components/ChatsPage";
import Popular from "./components/Popular";
import Trending from "./components/Trending";
import Stream from "./components/Stream";
import ChangePassword from "./components/ChangePassword";

function App() {

  // ✅ hook is INSIDE component
  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      document.documentElement.classList.remove("dark");
      return;
    }

    const theme = localStorage.getItem(`theme_${userId}`) || "light";

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/userprofile" element={<UserProfile />} />
        <Route path="/profilesetting" element={<ProfileSetting />} />
        <Route path="/discovercomm" element={<DiscoverComm />} />
        <Route path="/popular" element={<Popular />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/stream" element={<Stream />} />
        <Route path="/community/:id" element={<CommunityFeed />} />
        <Route path="/postdetail/:id" element={<PostDetail />} />
        <Route path="/createcomm" element={<CreateCommunity />} />
        <Route path="/newpost" element={<NewPost />} />
        <Route path="/messagefeed" element={<ChatsPage />} />
        <Route path="/messagefeed/:id" element={<ChatsPage />} />
        <Route path="/userinfo/:id" element={<UserInfo />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
