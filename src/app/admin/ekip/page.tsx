"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio?: string;
  image?: string;
  phone?: string;
  email?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
  isActive: boolean;
  sortOrder?: string;
}

export default function EkipYonetimiPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    image: "",
    phone: "",
    email: "",
    linkedin: "",
    instagram: "",
    twitter: "",
    isActive: true,
    sortOrder: "0",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const { data } = await response.json();
        setMembers(data || []);
      }
    } catch (error) {
      console.error("Ekip üyeleri yüklenemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(member?: TeamMember) {
    if (member) {
      setSelectedMember(member);
      setFormData({
        name: member.name,
        title: member.title,
        bio: member.bio || "",
        image: member.image || "",
        phone: member.phone || "",
        email: member.email || "",
        linkedin: member.socialMedia?.linkedin || "",
        instagram: member.socialMedia?.instagram || "",
        twitter: member.socialMedia?.twitter || "",
        isActive: member.isActive,
        sortOrder: member.sortOrder || "0",
      });
    } else {
      setSelectedMember(null);
      setFormData({
        name: "",
        title: "",
        bio: "",
        image: "",
        phone: "",
        email: "",
        linkedin: "",
        instagram: "",
        twitter: "",
        isActive: true,
        sortOrder: "0",
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        title: formData.title,
        bio: formData.bio || undefined,
        image: formData.image || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        socialMedia: {
          linkedin: formData.linkedin || undefined,
          instagram: formData.instagram || undefined,
          twitter: formData.twitter || undefined,
        },
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      const url = selectedMember
        ? `/api/team/${selectedMember.id}`
        : "/api/team";
      const method = selectedMember ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchMembers();
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ekip üyesini silmek istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  }

  async function toggleActive(member: TeamMember) {
    try {
      await fetch(`/api/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      fetchMembers();
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Ekip Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Ekip üyelerini ve profillerini yönetin
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors"
        >
          <Icon name="person_add" />
          Yeni Üye
        </button>
      </div>

      {/* Team Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon
            name="sync"
            className="text-emerald-400 text-3xl animate-spin"
          />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Icon name="groups" className="text-slate-600 text-5xl mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Henüz ekip üyesi yok
          </h3>
          <p className="text-slate-400 mb-4">
            Ekip üyelerini buradan ekleyebilirsiniz.
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors"
          >
            <Icon name="person_add" />
            İlk Üyeyi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div
              key={member.id}
              className={`bg-slate-800 border rounded-xl overflow-hidden transition-all ${member.isActive
                  ? "border-slate-700 hover:border-emerald-500/50"
                  : "border-red-500/30 opacity-60"
                }`}
            >
              {/* Image */}
              <div className="relative h-48 bg-slate-900">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="person" className="text-slate-600 text-6xl" />
                  </div>
                )}
                {!member.isActive && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                    Pasif
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-emerald-400 text-sm font-medium mb-3">
                  {member.title}
                </p>
                {member.bio && (
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                    {member.bio}
                  </p>
                )}

                {/* Contact */}
                <div className="flex items-center gap-4 text-slate-500 text-sm mb-4">
                  {member.phone && (
                    <span className="flex items-center gap-1">
                      <Icon name="phone" className="text-xs" />
                      {member.phone}
                    </span>
                  )}
                  {member.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Icon name="mail" className="text-xs" />
                      {member.email}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    {member.socialMedia?.linkedin && (
                      <a
                        href={member.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-[#0077b5] hover:bg-slate-700 rounded transition-colors"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                    {member.socialMedia?.instagram && (
                      <a
                        href={member.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-[#E1306C] hover:bg-slate-700 rounded transition-colors"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(member)}
                      className={`p-2 rounded transition-colors ${member.isActive
                          ? "text-slate-400 hover:text-amber-400 hover:bg-slate-700"
                          : "text-emerald-400 hover:text-emerald-300 hover:bg-slate-700"
                        }`}
                      title={member.isActive ? "Pasif Yap" : "Aktif Yap"}
                    >
                      <Icon
                        name={member.isActive ? "visibility_off" : "visibility"}
                      />
                    </button>
                    <button
                      onClick={() => openModal(member)}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                      title="Düzenle"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                      title="Sil"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {selectedMember ? "Üye Düzenle" : "Yeni Ekip Üyesi"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Kapat"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="memberName" className="block text-sm font-medium text-slate-300 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    id="memberName"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Mustafa Demir"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ünvan *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Kurucu & Genel Müdür"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Biyografi
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Kısa biyografi..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fotoğraf URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    placeholder="+90 532 123 45 67"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="mustafa@demir.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">
                  Sosyal Medya
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin: e.target.value })
                      }
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                      placeholder="https://instagram.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={formData.twitter}
                      onChange={(e) =>
                        setFormData({ ...formData, twitter: e.target.value })
                      }
                      placeholder="https://twitter.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Aktif</span>
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="sortOrder" className="text-sm text-slate-300">Sıra:</label>
                  <input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: e.target.value })
                    }
                    min="0"
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Icon name="sync" className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Icon name="save" />
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
