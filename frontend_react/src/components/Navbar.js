{/* Minimal Navbar */}
<div className="flex justify-between items-center px-6 py-4">
  <h1 className="text-2xl font-bold text-gray-800">Home</h1>
  <div className="flex items-center space-x-4">
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={handleProfile}
      className="flex items-center gap-1 text-gray-800 font-semibold hover:text-gray-600 transition"
    >
      <UserCircleIcon className="w-6 h-6" />
      Profile
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={handleLogout}
      className="flex items-center gap-1 text-gray-800 font-semibold hover:text-gray-600 transition"
    >
      <ArrowRightOnRectangleIcon className="w-6 h-6" />
      Logout
    </motion.button>
  </div>
</div>
