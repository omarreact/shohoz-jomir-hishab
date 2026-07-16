"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Users, Shield, Save, X, KeyRound, Mail, RefreshCw, Eye, EyeOff, Crown, UserCheck, UserX } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-danger",
  "Admin": "bg-primary",
  "Editor": "bg-success",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Super Admin": <Crown size={14} className="me-1" />,
  "Admin": <Shield size={14} className="me-1" />,
  "Editor": <UserCheck size={14} className="me-1" />,
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function AvatarCircle({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    "Super Admin": "linear-gradient(135deg, #ef4444, #b91c1c)",
    "Admin": "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "Editor": "linear-gradient(135deg, #22c55e, #15803d)",
  };
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 shadow-sm"
      style={{ 
        width: 56, 
        height: 56, 
        background: colors[role] || "#64748b", 
        fontSize: 20,
        border: "3px solid rgba(255,255,255,0.1)"
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

  useEffect(() => { fetchUsers(); }, []);

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
    if (!name || !email) { alert("অনুগ্রহ করে নাম এবং ইমেইল দিন"); return; }
    if (!password || password.length < 6) { alert("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"); return; }

    setIsSubmitting(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const signUpData = await signUpRes.json();
      if (!signUpRes.ok) throw new Error(signUpData.error?.message || "Auth error");

      await addDoc(collection(db, "admin_users"), { name, email, role, status });

      setName(""); setEmail(""); setPassword(""); setRole("Admin"); setStatus("Active");
      setShowCreateForm(false);
      showSuccess(`✅ "${name}" সফলভাবে তৈরি হয়েছে!`);
      fetchUsers();
    } catch (error: unknown) {
      alert(`সমস্যা হয়েছে: ${error instanceof Error ? error.message : "Unknown error"}`);
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
      alert(`আপডেট করতে সমস্যা: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleSendPasswordReset = async (userEmail: string) => {
    setIsSendingReset(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed");
      showSuccess(`✅ পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!`);
    } catch (error: unknown) {
      alert(`ইমেইল পাঠাতে সমস্যা: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (confirm(`"${userName}" কে ডিলিট করতে চান? এই কাজটি ফিরিয়ে আনা যাবে না।`)) {
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
    <div className="fade-in" data-admin-panel="true">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <SectionHeader 
          title="ইউজার ম্যানেজমেন্ট" 
          subtitle={`সিস্টেমে মোট ${users.length} জন ইউজার আছেন`}
          className="mb-0"
        />
        <Button
          variant={showCreateForm ? "secondary" : "primary"}
          className="rounded-pill"
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ transition: "all 0.3s ease", transform: showCreateForm ? "scale(0.95)" : "scale(1)" }}
          leftIcon={showCreateForm ? <X size={20} /> : <Plus size={20} />}
        >
          {showCreateForm ? "বাতিল করুন" : "নতুন ইউজার যোগ করুন"}
        </Button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="alert alert-success border-0 rounded-4 shadow-sm fw-bold mb-4 d-flex align-items-center fade-in">
          <div className="bg-success text-white rounded-circle p-1 me-3 d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>✓</div>
          {successMsg}
        </div>
      )}

      {/* Create Form - Premium UI */}
      {showCreateForm && (
        <Card className="mb-5 border-0" style={{ backgroundColor: "var(--card-bg)" }}>
          <CardBody className="p-5">
            <h5 className="fw-bolder text-primary mb-4 d-flex align-items-center">
              <Shield className="me-2 text-primary" size={24} /> সিকিউর ইউজার ক্রিয়েশন
            </h5>
            <form onSubmit={handleCreate}>
              <div className="row g-4">
                <div className="col-md-6">
                  <Input 
                    label="পূর্ণ নাম"
                    type="text" 
                    placeholder="e.g. Faruk Khan" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <Input 
                    label="ইমেইল ঠিকানা"
                    type="email" 
                    placeholder="admin@domain.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <Input 
                    label="নতুন পাসওয়ার্ড"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    rightIcon={
                      <div className="cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </div>
                    }
                  />
                </div>
                <div className="col-md-3">
                  <Select 
                    label="অ্যাক্সেস রোল"
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { label: "👑 সুপার অ্যাডমিন", value: "Super Admin" },
                      { label: "🛡️ অ্যাডমিন", value: "Admin" },
                      { label: "✍️ এডিটর", value: "Editor" }
                    ]}
                  />
                </div>
                <div className="col-md-3">
                  <Select 
                    label="অ্যাকাউন্ট স্ট্যাটাস"
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { label: "✅ Active (সক্রিয়)", value: "Active" },
                      { label: "🚫 Suspended (স্থগিত)", value: "Suspended" }
                    ]}
                  />
                </div>
              </div>
              <div className="mt-5 pt-3 border-top d-flex justify-content-end">
                <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg" className="rounded-pill" leftIcon={!isSubmitting && <Save size={20} />}>
                  {isSubmitting ? "ইউজার তৈরি করা হচ্ছে..." : "ইউজার সেভ করুন"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* User Cards Grid - Premium UI */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5 my-5">
          <div className="spinner-border text-primary border-3" style={{ width: "3rem", height: "3rem" }} />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-5 my-5 rounded-4 shadow-sm border-0 text-muted" style={{ backgroundColor: "var(--card-bg)" }}>
          <Users size={64} className="mb-3 opacity-25" />
          <h4 className="fw-bold text-white">কোনো ইউজার পাওয়া যায়নি</h4>
          <p>সিস্টেমে কাজ করার জন্য নতুন ইউজার তৈরি করুন</p>
        </div>
      ) : (
        <div className="row g-4">
          {users.map((user) => (
            <div className="col-xl-6 col-lg-12" key={user.id}>
              <Card 
                className="border-0 h-100 position-relative overflow-hidden hover-shadow hover-lift"
                style={{ backgroundColor: "var(--card-bg)" }}
              >
                {/* Status Indicator Bar */}
                <div 
                  className="position-absolute top-0 start-0 h-100" 
                  style={{ 
                    width: "6px", 
                    background: user.status === "Suspended" ? "linear-gradient(to bottom, #ef4444, #f87171)" : "linear-gradient(to bottom, #10b981, #34d399)" 
                  }}
                />

                <CardBody className="p-4 ps-5">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    
                    {/* User Info Left Side */}
                    <div className="d-flex gap-3 align-items-center">
                      <AvatarCircle name={user.name} role={user.role} />
                      <div>
                        <h5 className="fw-bolder text-white mb-1 d-flex align-items-center gap-2">
                          {user.name || "(Un-named)"}
                          {user.status === "Suspended" && (
                            <span className="badge bg-danger rounded-pill fw-medium" style={{ fontSize: "10px", padding: "4px 8px" }}>
                              SUSPENDED
                            </span>
                          )}
                        </h5>
                        <div className="text-secondary fw-medium d-flex align-items-center" style={{ fontSize: "14px" }}>
                          <Mail size={14} className="me-2 opacity-75" /> {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu Right Side */}
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="btn btn-light text-primary btn-sm rounded-circle shadow-sm"
                        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="এডিট করুন"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="btn btn-light text-danger btn-sm rounded-circle shadow-sm"
                        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>

                  {/* Badges & Extra Info */}
                  <div className="mt-4 pt-3 border-top border-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex gap-2">
                      <span className={`badge ${ROLE_COLORS[user.role] || "bg-secondary"} rounded-pill d-flex align-items-center px-3 py-2 fw-medium shadow-sm`}>
                        {ROLE_ICONS[user.role]} {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSendPasswordReset(user.email)}
                      disabled={isSendingReset}
                      className="btn btn-outline-secondary btn-sm rounded-pill px-4 fw-bold text-dark border-2 d-flex align-items-center bg-white hover-bg-light"
                      style={{ fontSize: "13px" }}
                    >
                      <KeyRound size={14} className="me-2" /> 
                      {isSendingReset ? "পাঠানো হচ্ছে..." : "পাসওয়ার্ড রিসেট"}
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Glassmorphism Edit Modal */}
      {editingUser && (
        <div className="modal show d-flex align-items-center justify-content-center" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered w-100" style={{ maxWidth: "550px" }}>
            <Card className="w-100 border-0 shadow-lg fade-in p-0">
              {/* Modal Header */}
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-start justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <AvatarCircle name={editingUser.name} role={editingUser.role} />
                  <div>
                    <h5 className="modal-title fw-bolder text-dark mb-0">অ্যাকাউন্ট এডিট</h5>
                    <p className="text-secondary fw-medium mb-0 small">{editingUser.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)}>
                  <X size={20} />
                </Button>
              </div>
              
              {/* Modal Body */}
              <CardBody className="p-4">
                <Input 
                  label="পূর্ণ নাম"
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                />
                
                <div className="row g-4 mb-2 mt-0">
                  <div className="col-sm-6">
                    <Select 
                      label="অ্যাক্সেস রোল"
                      value={editRole} 
                      onChange={(e) => setEditRole(e.target.value)}
                      options={[
                        { label: "সুপার অ্যাডমিন", value: "Super Admin" },
                        { label: "অ্যাডমিন", value: "Admin" },
                        { label: "এডিটর", value: "Editor" }
                      ]}
                    />
                  </div>
                  <div className="col-sm-6">
                    <Select 
                      label="অ্যাকাউন্ট স্ট্যাটাস"
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                      options={[
                        { label: "✅ Active (সক্রিয়)", value: "Active" },
                        { label: "🚫 Suspended (স্থগিত)", value: "Suspended" }
                      ]}
                    />
                  </div>
                </div>
              </CardBody>

              {/* Modal Footer */}
              <div className="modal-footer border-0 p-4 pt-0 bg-transparent">
                <Button variant="secondary" size="lg" className="rounded-pill" onClick={() => setEditingUser(null)}>বাতিল</Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-pill"
                  onClick={handleEditSave}
                  isLoading={isEditSubmitting}
                  leftIcon={!isEditSubmitting && <Save size={20} />}
                >
                  {isEditSubmitting ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
