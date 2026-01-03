import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return null;
  }

  const submit = async () => {
    if (!oldPassword || !newPassword) return alert('Please fill both fields');
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/change_password', { old_password: oldPassword, new_password: newPassword }, { headers: { Authorization: `Token ${token}` } });
      alert('Password changed successfully');
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow">
        <h2 className="text-lg font-semibold mb-4">Change password</h2>
        <div className="space-y-3">
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Old password" className="w-full border rounded p-2" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full border rounded p-2" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-3 py-1 bg-cyan-500 text-white rounded">{loading ? 'Saving...' : 'Change'}</button>
        </div>
      </div>
    </div>
  );
}
