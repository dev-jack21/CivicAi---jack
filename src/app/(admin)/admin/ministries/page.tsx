'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, Check, X, AlertCircle, Loader2 } from 'lucide-react';

interface Ministry {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  policy_count: number;
}

export default function AdminMinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add form
  const [addName, setAddName] = useState('');
  const [addSlug, setAddSlug] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const flash = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    }
  };

  const fetchMinistries = async () => {
    try {
      const res = await fetch('/api/admin/ministries');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMinistries(data.ministries ?? []);
    } catch {
      flash('Failed to load ministries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMinistries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleAddNameChange = (val: string) => {
    setAddName(val);
    setAddSlug(toSlug(val));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/ministries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim(), slug: addSlug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? 'Failed to create ministry');
        return;
      }
      setMinistries((prev) =>
        [...prev, { ...data.ministry, policy_count: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setAddName('');
      setAddSlug('');
      flash('Ministry created successfully');
    } catch {
      setAddError('An unexpected error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (m: Ministry) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditSlug(m.slug);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: number) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ministries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), slug: editSlug.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? 'Failed to update ministry', 'error');
        return;
      }
      setMinistries((prev) =>
        prev
          .map((m) =>
            m.id === id ? { ...m, name: data.ministry.name, slug: data.ministry.slug } : m
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
      flash('Ministry updated');
    } catch {
      flash('An unexpected error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (m: Ministry) => {
    if (m.policy_count > 0) {
      flash(
        `Cannot delete "${m.name}" — it is used by ${m.policy_count} polic${m.policy_count === 1 ? 'y' : 'ies'}`,
        'error'
      );
      return;
    }
    if (!confirm(`Delete ministry "${m.name}"? This cannot be undone.`)) return;
    setDeletingId(m.id);
    try {
      const res = await fetch(`/api/admin/ministries/${m.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? 'Failed to delete', 'error');
        return;
      }
      setMinistries((prev) => prev.filter((item) => item.id !== m.id));
      flash('Ministry deleted');
    } catch {
      flash('An unexpected error occurred', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-inter flex items-center gap-3">
          <Building2 className="w-7 h-7 text-primary" />
          Ministry Management
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the curated list of government ministries available when uploading policies.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2"
          role="status"
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Add Ministry Card */}
      <div className="bg-surface border border-border-custom rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Add New Ministry
        </h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-64">
            <label
              htmlFor="add-min-name"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Ministry Name <span className="text-red-500">*</span>
            </label>
            <input
              id="add-min-name"
              type="text"
              value={addName}
              onChange={(e) => handleAddNameChange(e.target.value)}
              placeholder="e.g. Ministry of Energy"
              className="w-full px-3 py-2 text-sm border border-border-custom rounded-md bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={isAdding}
            />
          </div>
          <div className="flex-1 min-w-48">
            <label
              htmlFor="add-min-slug"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Slug (auto-generated)
            </label>
            <input
              id="add-min-slug"
              type="text"
              value={addSlug}
              onChange={(e) => setAddSlug(e.target.value)}
              placeholder="e.g. energy"
              className="w-full px-3 py-2 text-sm border border-border-custom rounded-md bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-mono"
              disabled={isAdding}
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !addName.trim()}
            className="inline-flex items-center gap-2 min-h-[38px] px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'Adding…' : 'Add Ministry'}
          </button>
        </form>
        {addError && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {addError}
          </p>
        )}
      </div>

      {/* Ministries Table */}
      <div className="bg-surface border border-border-custom rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-custom flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">All Ministries</h2>
          <span className="text-xs font-medium text-text-secondary bg-bg-base px-2.5 py-1 rounded-full border border-border-custom">
            {ministries.length} total
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-text-secondary">Loading ministries…</span>
          </div>
        ) : ministries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">No ministries yet</p>
            <p className="text-sm text-text-muted mt-1">Add ministries above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-base border-b border-border-custom">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Policies
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {ministries.map((m) => (
                  <tr key={m.id} className="hover:bg-bg-base/60 transition-colors">
                    {editingId === m.id ? (
                      <>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-primary rounded bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-border-custom rounded bg-surface text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-3 text-text-muted">{m.policy_count}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(m.id)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border-custom text-text-secondary rounded hover:bg-bg-base transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3 font-medium text-text-primary">{m.name}</td>
                        <td className="px-6 py-3 text-text-secondary font-mono text-xs">
                          {m.slug}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.policy_count > 0 ? 'bg-primary/10 text-primary' : 'bg-bg-base text-text-muted border border-border-custom'}`}
                          >
                            {m.policy_count} {m.policy_count === 1 ? 'policy' : 'policies'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(m)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border-custom text-text-secondary rounded hover:bg-bg-base hover:text-text-primary transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              disabled={deletingId === m.id || m.policy_count > 0}
                              title={
                                m.policy_count > 0
                                  ? `In use by ${m.policy_count} policies — cannot delete`
                                  : 'Delete ministry'
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              {deletingId === m.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
