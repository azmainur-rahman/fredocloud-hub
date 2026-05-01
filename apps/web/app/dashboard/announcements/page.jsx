"use client";

import { Megaphone, Pin, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAnnouncementStore from "../../../store/useAnnouncementStore.js";
import useWorkspaceStore from "../../../store/useWorkspaceStore.js";

const emptyAnnouncement = {
  content: "",
  pinned: false,
};

export default function AnnouncementsPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const announcements = useAnnouncementStore((state) => state.announcements);
  const isLoading = useAnnouncementStore((state) => state.isLoading);
  const fetchAnnouncements = useAnnouncementStore(
    (state) => state.fetchAnnouncements,
  );
  const createAnnouncement = useAnnouncementStore(
    (state) => state.createAnnouncement,
  );
  const updateAnnouncement = useAnnouncementStore(
    (state) => state.updateAnnouncement,
  );
  const deleteAnnouncement = useAnnouncementStore(
    (state) => state.deleteAnnouncement,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyAnnouncement);

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchAnnouncements(activeWorkspace.id).catch((error) =>
        toast.error(error.message),
      );
    }
  }, [activeWorkspace?.id, fetchAnnouncements]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    try {
      await createAnnouncement(activeWorkspace.id, form);
      toast.success("Announcement published.");
      setForm(emptyAnnouncement);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const togglePinned = async (announcement) => {
    try {
      await updateAnnouncement(activeWorkspace.id, announcement.id, {
        pinned: !announcement.pinned,
      });
      toast.success(
        announcement.pinned ? "Announcement unpinned." : "Announcement pinned.",
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (announcementId) => {
    try {
      await deleteAnnouncement(activeWorkspace.id, announcementId);
      toast.success("Announcement deleted.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
            Announcements
          </p>
          <h2 className="mt-2 text-3xl font-bold">Workspace feed</h2>
          <p className="mt-2 text-gray-400">
            Pin important updates and keep the team aligned.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-gray-950 transition hover:brightness-110"
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: accentColor }}
          type="button"
        >
          <Plus size={18} />
          New Announcement
        </button>
      </div>

      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center text-gray-300">
            {activeWorkspace
              ? "No announcements yet."
              : "Create or select a workspace to begin."}
          </div>
        ) : (
          announcements.map((announcement) => (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10"
              key={announcement.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                      <Megaphone size={14} />
                      Announcement
                    </span>
                    {announcement.pinned ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 px-3 py-1 text-xs font-semibold text-orange-200">
                        <Pin size={13} />
                        Pinned
                      </span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-200">
                    {announcement.content}
                  </p>
                  <p className="mt-4 text-xs text-gray-500">
                    Posted by {announcement.author?.name || "Team member"} on{" "}
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-gray-300 transition hover:border-orange-500/60 hover:text-orange-300"
                    onClick={() => togglePinned(announcement)}
                    type="button"
                  >
                    <Pin size={15} />
                    {announcement.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-red-500/50 hover:text-red-300"
                    onClick={() => handleDelete(announcement.id)}
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/30"
            onSubmit={handleCreate}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Publish announcement</h3>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              className="min-h-48 w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-orange-500"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="Write a rich update. Markdown or HTML can be stored here for now."
              value={form.content}
            />

            <label className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300">
              <input
                checked={form.pinned}
                className="h-4 w-4 accent-orange-500"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pinned: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Pin this announcement
            </label>

            <button
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold text-gray-950 transition hover:brightness-110 disabled:opacity-60"
              disabled={isLoading}
              style={{ backgroundColor: accentColor }}
              type="submit"
            >
              {isLoading ? "Publishing..." : "Publish announcement"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
