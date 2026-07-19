"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Users,
  Shield,
  Save,
  X,
  KeyRound,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  Crown,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-red-500",
  Admin: "bg-blue-500",
  Editor: "bg-green-500",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Super Admin": <Crown size={14} className="mr-1.5" />,
  Admin: <Shield size={14} className="mr-1.5" />,
  Editor: <UserCheck size={14} className="mr-1.5" />,
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function AvatarCircle({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    "Super Admin": "linear-gradient(135deg, #ef4444, #b91c1c)",
    Admin: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    Editor: "linear-gradient(135deg, #22c55e, #15803d)",
  };
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
      style={{
        width: 56,
        height: 56,
        background: colors[role] || "#64748b",
        fontSize: 20,
        border: "3px solid rgba(255,255,255,0.1)",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Admin");
  const [status, setStatus] = useState("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("Admin");
  const [editStatus, setEditStatus] = useState("Active");
  const [newPassword, setNewPassword] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "admin_users"));
      const usersData: AdminUser[] = [];
      querySnapshot.forEach((d) => {
        usersData.push({
          id: d.id,
          name: d.data().name || "",
          email: d.data().email || "",
          role: d.data().role || "Admin",
          status: d.data().status || "Active",
        });
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert("অনুগ্রহ করে নাম এবং ইমেইল দিন");
      return;
    }
    if (!password || password.length < 6) {
      alert("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন");
      return;
    }

    setIsSubmitting(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        },
      );
      const signUpData = await signUpRes.json();
      if (!signUpRes.ok)
        throw new Error(signUpData.error?.message || "Auth error");

      await addDoc(collection(db, "admin_users"), {
        name,
        email,
        role,
        status,
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("Admin");
      setStatus("Active");
      setShowCreateForm(false);
      showSuccess(`✅ "${name}" সফলভাবে তৈরি হয়েছে!`);
      fetchUsers();
    } catch (error: unknown) {
      alert(
        `সমস্যা হয়েছে: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditRole(user.role || "Admin");
    setEditStatus(user.status || "Active");
    setNewPassword("");
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setIsEditSubmitting(true);
    try {
      await updateDoc(doc(db, "admin_users", editingUser.id), {
        name: editName,
        role: editRole,
        status: editStatus,
      });

      setEditingUser(null);
      showSuccess(`✅ "${editName}" আপডেট হয়েছে!`);
      fetchUsers();
    } catch (error: unknown) {
      alert(
        `আপডেট করতে সমস্যা: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleSendPasswordReset = async (userEmail: string) => {
    setIsSendingReset(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "PASSWORD_RESET",
            email: userEmail,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed");
      showSuccess(`✅ পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!`);
    } catch (error: unknown) {
      alert(
        `ইমেইল পাঠাতে সমস্যা: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (
      confirm(`"${userName}" কে ডিলিট করতে চান? এই কাজটি ফিরিয়ে আনা যাবে না।`)
    ) {
      try {
        await deleteDoc(doc(db, "admin_users", id));
        showSuccess(`🗑️ "${userName}" ডিলিট হয়েছে।`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="fade-in visible" data-admin-panel="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-[var(--text-secondary)]">সিস্টেমে মোট {users.length} জন ইউজার আছেন</p>
        </div>
        <button
          className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-md ${
            showCreateForm 
              ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] scale-95" 
              : "cta-gradient text-[var(--bg)] hover:scale-105"
          }`}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "বাতিল করুন" : "নতুন ইউজার যোগ করুন"}
        </button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl p-4 mb-8 font-bold flex items-center fade-in visible">
          <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0">
            ✓
          </div>
          {successMsg}
        </div>
      )}

      {/* Create Form - Premium UI */}
      {showCreateForm && (
        <div className="card-new mb-10 overflow-hidden border-t-4 border-t-blue-500 fade-in visible">
          <div className="p-6 md:p-8">
            <h5 className="font-bold text-blue-500 mb-6 flex items-center text-xl">
              <Shield className="mr-3 text-blue-500" size={24} /> সিকিউর ইউজার
              ক্রিয়েশন
            </h5>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-[var(--text-primary)] font-bold mb-2">পূর্ণ নাম</label>
                  <input
                    type="text"
                    placeholder="e.g. Faruk Khan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[var(--text-primary)] font-bold mb-2">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    placeholder="admin@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[var(--text-primary)] font-bold mb-2">নতুন পাসওয়ার্ড</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-2">অ্যাক্সেস রোল</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  >
                    <option value="Super Admin">👑 সুপার অ্যাডমিন</option>
                    <option value="Admin">🛡️ অ্যাডমিন</option>
                    <option value="Editor">✍️ এডিটর</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-2">অ্যাকাউন্ট স্ট্যাটাস</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  >
                    <option value="Active">✅ Active (সক্রিয়)</option>
                    <option value="Suspended">🚫 Suspended (স্থগিত)</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--text-primary)] text-[var(--bg)] font-bold rounded-xl px-8 py-3.5 shadow-md hover:-translate-y-0.5 transition-transform flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin mr-3"></span>
                      ইউজার তৈরি করা হচ্ছে...
                    </>
                  ) : (
                    "ইউজার সেভ করুন"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Cards Grid - Premium UI */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : users.length === 0 ? (
        <div className="card-new py-16 text-center text-[var(--text-secondary)]">
          <Users size={64} className="mx-auto mb-4 opacity-25" />
          <h4 className="font-bold text-[var(--text-primary)] text-2xl mb-2">কোনো ইউজার পাওয়া যায়নি</h4>
          <p>সিস্টেমে কাজ করার জন্য নতুন ইউজার তৈরি করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => (
            <div key={user.id} className="card-new overflow-hidden group hover:border-[var(--accent)] transition-all">
              {/* Status Indicator Bar */}
              <div
                className="absolute top-0 left-0 h-full w-1.5"
                style={{
                  background:
                    user.status === "Suspended"
                      ? "linear-gradient(to bottom, #ef4444, #f87171)"
                      : "linear-gradient(to bottom, #10b981, #34d399)",
                }}
              />

              <div className="p-6 pl-8">
                <div className="flex items-start justify-between gap-4">
                  {/* User Info Left Side */}
                  <div className="flex gap-4 items-center">
                    <AvatarCircle name={user.name} role={user.role} />
                    <div>
                      <h5 className="font-bold text-[var(--text-primary)] text-lg mb-1 flex items-center flex-wrap gap-2">
                        {user.name || "(Un-named)"}
                        {user.status === "Suspended" && (
                          <span className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-[10px] px-2 py-0.5 tracking-wider uppercase">
                            Suspended
                          </span>
                        )}
                      </h5>
                      <div className="text-[var(--text-secondary)] font-medium text-sm flex items-center break-all">
                        <Mail size={14} className="mr-2 opacity-75 shrink-0" />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu Right Side */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(user)}
                      className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors shadow-sm"
                      title="এডিট করুন"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shadow-sm"
                      title="ডিলিট করুন"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Badges & Extra Info */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-2">
                    <span
                      className={`${ROLE_COLORS[user.role] || "bg-gray-500"} text-white rounded-full flex items-center px-3 py-1 text-sm font-bold shadow-sm`}
                    >
                      {ROLE_ICONS[user.role]} {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSendPasswordReset(user.email)}
                    disabled={isSendingReset}
                    className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg)] hover:border-[var(--text-primary)] rounded-full px-4 py-2 font-bold text-sm flex items-center transition-colors disabled:opacity-50"
                  >
                    <KeyRound size={16} className="mr-2" />
                    {isSendingReset ? "পাঠানো হচ্ছে..." : "পাসওয়ার্ড রিসেট"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Glassmorphism Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in visible">
          <div className="card-new w-full max-w-lg overflow-hidden shadow-2xl relative bg-[var(--surface)]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-start justify-between">
              <div className="flex items-center gap-4">
                <AvatarCircle
                  name={editingUser.name}
                  role={editingUser.role}
                />
                <div>
                  <h5 className="font-bold text-[var(--text-primary)] text-xl mb-1">
                    অ্যাকাউন্ট এডিট
                  </h5>
                  <p className="text-[var(--text-secondary)] font-medium text-sm mb-0">
                    {editingUser.email}
                  </p>
                </div>
              </div>
              <button
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
                onClick={() => setEditingUser(null)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">পূর্ণ নাম</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-2">অ্যাক্সেস রোল</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  >
                    <option value="Super Admin">সুপার অ্যাডমিন</option>
                    <option value="Admin">অ্যাডমিন</option>
                    <option value="Editor">এডিটর</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-2">অ্যাকাউন্ট স্ট্যাটাস</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  >
                    <option value="Active">✅ Active (সক্রিয়)</option>
                    <option value="Suspended">🚫 Suspended (স্থগিত)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-black/5 dark:bg-white/5 flex gap-3 justify-end">
              <button
                className="px-6 py-2.5 rounded-full font-bold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                onClick={() => setEditingUser(null)}
              >
                বাতিল
              </button>
              <button
                className="px-6 py-2.5 rounded-full font-bold bg-[var(--text-primary)] text-[var(--bg)] hover:scale-105 transition-transform flex items-center disabled:opacity-70 disabled:hover:scale-100 shadow-md"
                onClick={handleEditSave}
                disabled={isEditSubmitting}
              >
                {isEditSubmitting ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
