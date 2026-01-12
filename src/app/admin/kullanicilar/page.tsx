"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

// Mock data
const mockUsers = [
  {
    id: "1",
    name: "Mustafa Demir",
    email: "mustafa@demirgayrimenkul.com",
    role: "admin",
    isActive: true,
    createdAt: "2024-01-01",
    lastLogin: "2026-01-11T09:30:00",
  },
  {
    id: "2",
    name: "Ayşe Yılmaz",
    email: "ayse@demirgayrimenkul.com",
    role: "editor",
    isActive: true,
    createdAt: "2024-06-15",
    lastLogin: "2026-01-10T14:20:00",
  },
  {
    id: "3",
    name: "Mehmet Kaya",
    email: "mehmet@demirgayrimenkul.com",
    role: "viewer",
    isActive: false,
    createdAt: "2024-09-20",
    lastLogin: "2025-12-01T11:00:00",
  },
];

const roleLabels: Record<string, string> = {
  admin: "Yönetici",
  editor: "Editör",
  viewer: "İzleyici",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  editor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function AdminKullanicilarPage() {
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "viewer",
    password: "",
  });

  const handleCreateUser = () => {
    console.log("Yeni kullanıcı:", newUser);
    setShowModal(false);
    setNewUser({ name: "", email: "", role: "viewer", password: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Kullanıcı Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mockUsers.length} kullanıcı
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Icon name="person_add" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Users Table */}
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
                Son Giriş
              </th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {mockUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-slate-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                      roleColors[user.role]
                    }`}
                  >
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1 text-sm ${
                      user.isActive ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.isActive ? "bg-emerald-400" : "bg-slate-500"
                      }`}
                    />
                    {user.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-400 text-sm">
                  {new Date(user.lastLogin).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Düzenle"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
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

      {/* New User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                Yeni Kullanıcı Ekle
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Yönetici</option>
                  <option value="editor">Editör</option>
                  <option value="viewer">İzleyici</option>
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
                onClick={handleCreateUser}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors"
              >
                Kullanıcı Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
