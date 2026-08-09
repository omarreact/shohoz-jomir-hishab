"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Edit,
  Users,
  Shield,
  X,
  KeyRound,
  Mail,
  Crown,
  UserCheck,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  lockedUntil: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-red-500",
  Admin: "bg-blue-500",
  Editor: "bg-green-500",
  "Basic User": "bg-gray-500",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Super Admin": <Crown size={14} className="mr-1.5" />,
  Admin: <Shield size={14} className="mr-1.5" />,
  Editor: <UserCheck size={14} className="mr-1.5" />,
  "Basic User": <UserCheck size={14} className="mr-1.5" />,
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AvatarCircle({ name, role }: { name: string | null; role: string }) {
  const colors: Record<string, string> = {
    "Super Admin": "linear-gradient(135deg, #ef4444, #b91c1c)",
    Admin: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    Editor: "linear-gradient(135deg, #22c55e, #15803d)",
    "Basic User": "linear-gradient(135deg, #64748b, #475569)",
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

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("Admin");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("Basic User");
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

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
      const res = await fetch("/api/admin/users?limit=100");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
<<<<<<< HEAD
      const usersList = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.users)
          ? data.users
          : [];
      setUsers(usersList);
=======
      setUsers(data.data ?? data.users ?? []);
>>>>>>> 58add4b (WIP: save changes before push)
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditRole(user.role || "Admin");
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setIsEditSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, role: editRole }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingUser(null);
      showSuccess(
        `✅ "${editingUser.name || editingUser.email}" আপডেট হয়েছে!`,
      );
      fetchUsers();
    } catch (error: any) {
      alert(`আপডেট করতে সমস্যা: ${error.message}`);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleSuspend = async (user: AdminUser) => {
    const isSuspended =
      !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
    const action = isSuspended ? "unsuspend" : "suspend";
    const label = isSuspended ? "আনসাসপেন্ড" : "সাসপেন্ড";

    if (!confirm(`"${user.name || user.email}" কে ${label} করতে চান?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id, durationHours: 72 }),
      });
      if (!res.ok) throw new Error("Failed");
      showSuccess(`✅ "${user.name || user.email}" ${label} করা হয়েছে।`);
      fetchUsers();
    } catch (error: any) {
      alert(`সমস্যা হয়েছে: ${error.message}`);
    }
  };

  const handleCreateUser = async () => {
    setIsCreateSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          email: createEmail,
          name: createName,
          password: createPassword,
          role: createRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to create user");
      }

      setIsCreateOpen(false);
      setCreateEmail("");
      setCreateName("");
      setCreatePassword("");
      setCreateRole("Basic User");
      showSuccess(`✅ নতুন ইউজার তৈরি হয়েছে!`);
      fetchUsers();
    } catch (error: any) {
      alert(`ত্রুটি: ${error.message}`);
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  return (
    <div className="fade-in visible" data-admin-panel="true">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            ইউজার ম্যানেজমেন্ট
          </h1>
          <p className="text-[var(--text-secondary)]">
            সিস্টেমে মোট {users.length} জন ইউজার আছেন
          </p>
        </div>
        <button
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold shadow-md transition-colors"
          onClick={() => setIsCreateOpen(true)}
        >
          নতুন ইউজার তৈরি করুন
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl p-4 mb-8 font-bold flex items-center fade-in visible">
          <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0">
            ✓
          </div>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="card-new py-16 text-center text-[var(--text-secondary)]">
          <Users size={64} className="mx-auto mb-4 opacity-25" />
          <h4 className="font-bold text-[var(--text-primary)] text-2xl mb-2">
            কোনো ইউজার পাওয়া যায়নি
          </h4>
          <p>ব্যবহারকারীরা রেজিস্ট্রেশন করলে এখানে দেখা যাবে।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => {
            const isSuspended =
              !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
            return (
              <div
                key={user.id}
                className="card-new overflow-hidden group hover:border-[var(--accent)] transition-all relative"
              >
                <div
                  className="absolute top-0 left-0 h-full w-1.5"
                  style={{
                    background: isSuspended
                      ? "linear-gradient(to bottom, #ef4444, #f87171)"
                      : "linear-gradient(to bottom, #10b981, #34d399)",
                  }}
                />
                <div className="p-6 pl-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 items-center">
                      <AvatarCircle name={user.name} role={user.role} />
                      <div>
                        <h5 className="font-bold text-[var(--text-primary)] text-lg mb-1 flex items-center flex-wrap gap-2">
                          {user.name || "(নাম নেই)"}
                          {isSuspended && (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-[10px] px-2 py-0.5 tracking-wider uppercase">
                              Suspended
                            </span>
                          )}
                        </h5>
                        <div className="text-[var(--text-secondary)] font-medium text-sm flex items-center break-all">
                          <Mail
                            size={14}
                            className="mr-2 opacity-75 shrink-0"
                          />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openEdit(user)}
                        className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors shadow-sm"
                        title="রোল পরিবর্তন করুন"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                    <span
                      className={`${ROLE_COLORS[user.role] || "bg-gray-500"} text-white rounded-full flex items-center px-3 py-1 text-sm font-bold shadow-sm`}
                    >
                      {ROLE_ICONS[user.role]} {user.role}
                    </span>
                    <button
                      onClick={() => handleSuspend(user)}
                      className={`border rounded-full px-4 py-2 font-bold text-sm flex items-center transition-colors ${
                        isSuspended
                          ? "border-green-500/30 text-green-500 hover:bg-green-500/10"
                          : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg)] hover:border-red-400 hover:text-red-400"
                      }`}
                    >
                      <KeyRound size={16} className="mr-2" />
                      {isSuspended ? "আনসাসপেন্ড করুন" : "সাসপেন্ড করুন"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in visible">
          <div className="card-new w-full max-w-md overflow-hidden shadow-2xl bg-[var(--surface)]">
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-start justify-between">
              <div className="flex items-center gap-4">
                <AvatarCircle name={editingUser.name} role={editingUser.role} />
                <div>
                  <h5 className="font-bold text-[var(--text-primary)] text-xl mb-1">
                    রোল পরিবর্তন
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

            <div className="p-6">
              <label className="block text-[var(--text-primary)] font-bold mb-2">
                অ্যাক্সেস রোল
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
              >
                <option value="Super Admin">👑 সুপার অ্যাডমিন</option>
                <option value="Admin">🛡️ অ্যাডমিন</option>
                <option value="Editor">✍️ এডিটর</option>
                <option value="Basic User">👤 বেসিক ইউজার</option>
              </select>
            </div>

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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in visible">
          <div className="card-new w-full max-w-lg overflow-hidden shadow-2xl bg-[var(--surface)]">
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-start justify-between">
              <div>
                <h5 className="font-bold text-[var(--text-primary)] text-xl mb-1">
                  নতুন ইউজার তৈরি করুন
                </h5>
                <p className="text-[var(--text-secondary)] text-sm">
                  নতুন ব্যবহারকারীকে একটি রোলের সাথে তৈরি করুন।
                </p>
              </div>
              <button
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">
                  ইমেল
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">
                  নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  placeholder="Example Name"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">
                  পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">
                  রোল
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                >
                  <option value="Super Admin">👑 সুপার অ্যাডমিন</option>
                  <option value="Admin">🛡️ অ্যাডমিন</option>
                  <option value="Editor">✍️ এডিটর</option>
                  <option value="Basic User">👤 বেসিক ইউজার</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-black/5 dark:bg-white/5 flex gap-3 justify-end">
              <button
                className="px-6 py-2.5 rounded-full font-bold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                onClick={() => setIsCreateOpen(false)}
              >
                বাতিল
              </button>
              <button
                className="px-6 py-2.5 rounded-full font-bold bg-[var(--text-primary)] text-[var(--bg)] hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100 shadow-md"
                onClick={handleCreateUser}
                disabled={isCreateSubmitting}
              >
                {isCreateSubmitting ? "তৈরি হচ্ছে..." : "উল্লিখিত ইউজার তৈরি করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
