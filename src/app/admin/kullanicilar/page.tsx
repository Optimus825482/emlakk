"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "Yönetici",
  editor: "Editör",
  viewer: "İzleyici",
  user: "Kullanıcı",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  editor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  user: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function AdminKullanicilarPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer",
    password: "",
    phone: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Kullanıcılar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "viewer",
      password: "",
      phone: "",
    });
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      phone: user.phone || "",
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formData.name || !formData.email) {
      alert("Ad ve email zorunludur");
      return;
    }

    if (!editingUser && !formData.password) {
      alert("Yeni kullanıcı için şifre zorunludur");
      return;
    }

    setSaving(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const body = editingUser ? { id: editingUser.id, ...formData } : formData;

      const res = await fetch("/api/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "İşlem başarısız");
      }

      await fetchUsers();
      setShowModal(false);
      setEditingUser(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: User) {
    if (
      !confirm(`"${user.name}" kullanıcısını silmek istediğinize emin misiniz?`)
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Silme başarısız");
      }
      await fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Silme hatası");
    }
  }

  async function toggleUserStatus(user: User) {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });

      if (!res.ok) {
        throw new Error("Durum güncellenemedi");
      }

      await fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Güncelleme hatası");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Kullanıcı Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {users.length} kullanıcı
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Icon name="person_add" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Icon name="group" className="text-5xl text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Henüz kullanıcı yok</p>
          <p className="text-slate-500 text-sm mt-2">
            İlk kullanıcıyı eklemek için yukarıdaki butonu kullanın
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-500 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${roleColors[user.role] || roleColors.user
                        }`}
                    >
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`inline-flex items-center gap-1 text-sm ${user.isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                      />
                      {user.isActive ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-slate-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                        title="Sil"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Kapat"
                className="text-slate-400 hover:text-white"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">
                  Ad Soyad *
                </label>
                <input
                  id="userName"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-slate-300 mb-2">
                  E-posta *
                </label>
                <input
                  id="userEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0532 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {editingUser ? "Yeni Şifre (boş bırakılabilir)" : "Şifre *"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={
                    editingUser ? "Değiştirmek için yeni şifre girin" : ""
                  }
                />
              </div>
              <div>
                <label htmlFor="userRole" className="block text-sm font-medium text-slate-300 mb-2">
                  Rol
                </label>
                <select
                  id="userRole"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Yönetici</option>
                  <option value="editor">Editör</option>
                  <option value="viewer">İzleyici</option>
                  <option value="user">Kullanıcı</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Kaydediliyor..."
                  : editingUser
                    ? "Güncelle"
                    : "Kullanıcı Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
