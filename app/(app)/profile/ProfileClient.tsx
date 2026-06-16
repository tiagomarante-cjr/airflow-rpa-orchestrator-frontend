"use client";

import { useRef, useState } from "react";
import { Camera, Check, Pencil, X } from "lucide-react";

interface ProfileClientProps {
  email: string;
  initialName: string;
  initialImage: string | null;
  role: string;
  permissions: Record<string, string[]>;
}

export function ProfileClient({
  email,
  initialName,
  initialImage,
  role,
  permissions,
}: ProfileClientProps) {
  const [name, setName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [image, setImage] = useState(initialImage);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      setName(nameInput.trim());
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setSavingName(false);
    }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/user/photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.imageUrl) {
        setImage(`${data.imageUrl}?t=${Date.now()}`);
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  const isWildcard = "*" in permissions;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Account</h2>
        </div>
        <div className="flex items-start gap-6 px-5 py-6">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
              {image ? (
                <img
                  src={image}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Change photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file);
                e.target.value = "";
              }}
            />
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <span className="text-xs text-white">…</span>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            {/* Display name */}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">
                Display name
              </p>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameInput(name);
                      }
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {savingName ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(name);
                    }}
                    className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {name}
                  </span>
                  {nameSaved && (
                    <span className="text-xs font-medium text-emerald-600">
                      Saved!
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setNameInput(name);
                    }}
                    title="Edit name"
                    className="text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Email</p>
              <p className="text-sm text-slate-900">{email}</p>
            </div>

            {/* Role */}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Role</p>
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700 ring-1 ring-inset ring-indigo-500/20">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-700">
            DAG Permissions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The DAGs you have access to. Contact an admin to change these.
          </p>
        </div>
        <div className="px-5 py-4">
          {isWildcard ? (
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-500/30">
                All DAGs (wildcard)
              </span>
              <div className="flex gap-1.5">
                {permissions["*"].map((action) => (
                  <span
                    key={action}
                    className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/30"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ) : Object.keys(permissions).length === 0 ? (
            <p className="text-sm text-slate-400">No DAGs assigned.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(permissions).map(([dagId, actions]) => (
                <div key={dagId} className="flex items-center gap-3">
                  <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-500/30">
                    {dagId}
                  </span>
                  <div className="flex gap-1.5">
                    {actions.map((action) => (
                      <span
                        key={action}
                        className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/30"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
