"use client";

import {
  Megaphone,
  MessageCircle,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../lib/axios.js";
import useAnnouncementStore from "../../../store/useAnnouncementStore.js";
import useWorkspaceStore from "../../../store/useWorkspaceStore.js";

const emptyAnnouncement = {
  content: "",
  pinned: false,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const isImageAttachment = (attachment) =>
  attachment.fileType?.startsWith("image/");

export default function AnnouncementsPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const isAdmin = activeWorkspace?.role === "ADMIN";
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
  const createComment = useAnnouncementStore((state) => state.createComment);
  const toggleReaction = useAnnouncementStore((state) => state.toggleReaction);
  const deleteAnnouncement = useAnnouncementStore(
    (state) => state.deleteAnnouncement,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState(emptyAnnouncement);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingComments, setPendingComments] = useState({});
  const [pendingReactions, setPendingReactions] = useState({});
  const [pendingAnnouncements, setPendingAnnouncements] = useState({});

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchAnnouncements(activeWorkspace.id).catch((error) =>
        toast.error(error.message),
      );
    }
  }, [activeWorkspace?.id, fetchAnnouncements]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const announcement = editingAnnouncement
        ? await updateAnnouncement(
            activeWorkspace.id,
            editingAnnouncement.id,
            form,
          )
        : await createAnnouncement(activeWorkspace.id, form);

      if (!editingAnnouncement && attachmentFile) {
        const formData = new FormData();

        formData.append("attachment", attachmentFile);
        formData.append("entityType", "ANNOUNCEMENT");
        formData.append("entityId", announcement.id);

        try {
          await api.post(
            `/workspaces/${activeWorkspace.id}/attachments`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          await fetchAnnouncements(activeWorkspace.id);
        } catch (error) {
          toast.error(
            getErrorMessage(error, "Announcement saved, attachment failed."),
          );
        }
      }

      toast.success(
        editingAnnouncement
          ? "Announcement updated."
          : "Announcement published.",
      );
      setForm(emptyAnnouncement);
      setEditingAnnouncement(null);
      setAttachmentFile(null);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save announcement."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePinned = async (announcement) => {
    if (pendingAnnouncements[announcement.id]) {
      return;
    }

    setPendingAnnouncements((current) => ({
      ...current,
      [announcement.id]: true,
    }));

    try {
      await updateAnnouncement(activeWorkspace.id, announcement.id, {
        pinned: !announcement.pinned,
      });
      toast.success(
        announcement.pinned ? "Announcement unpinned." : "Announcement pinned.",
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingAnnouncements((current) => ({
        ...current,
        [announcement.id]: false,
      }));
    }
  };

  const handleDelete = async (announcementId) => {
    if (pendingAnnouncements[announcementId]) {
      return;
    }

    setPendingAnnouncements((current) => ({
      ...current,
      [announcementId]: true,
    }));

    try {
      await deleteAnnouncement(activeWorkspace.id, announcementId);
      toast.success("Announcement deleted.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingAnnouncements((current) => ({
        ...current,
        [announcementId]: false,
      }));
    }
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setForm(emptyAnnouncement);
    setAttachmentFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      content: announcement.content || "",
      pinned: Boolean(announcement.pinned),
    });
    setAttachmentFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setForm(emptyAnnouncement);
    setAttachmentFile(null);
  };

  const handleComment = async (announcementId) => {
    const content = commentDrafts[announcementId]?.trim();

    if (!content) {
      toast.error("Write a comment first.");
      return;
    }

    if (pendingComments[announcementId]) {
      return;
    }

    setPendingComments((current) => ({ ...current, [announcementId]: true }));

    try {
      await createComment(activeWorkspace.id, announcementId, { content });
      setCommentDrafts((current) => ({ ...current, [announcementId]: "" }));
      toast.success("Comment posted.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingComments((current) => ({
        ...current,
        [announcementId]: false,
      }));
    }
  };

  const handleReaction = async (announcementId, emoji) => {
    const key = `${announcementId}:${emoji}`;

    if (pendingReactions[key]) {
      return;
    }

    setPendingReactions((current) => ({ ...current, [key]: true }));

    try {
      await toggleReaction(activeWorkspace.id, announcementId, emoji);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingReactions((current) => ({ ...current, [key]: false }));
    }
  };

  const getReactionGroups = (reactions = []) =>
    reactions.reduce((groups, reaction) => {
      const current = groups[reaction.emoji] || 0;

      return { ...groups, [reaction.emoji]: current + 1 };
    }, {});

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
        {isAdmin ? (
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-gray-950 transition hover:brightness-110"
            onClick={openCreateModal}
            style={{ backgroundColor: accentColor }}
            type="button"
          >
            <Plus size={18} />
            New Announcement
          </button>
        ) : null}
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
                  {(announcement.attachments || []).length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {announcement.attachments.map((attachment) =>
                        isImageAttachment(attachment) ? (
                          <a
                            className="block overflow-hidden rounded-xl border border-white/10 bg-gray-950/60 transition hover:border-orange-500/60"
                            href={attachment.url}
                            key={attachment.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <img
                              alt={attachment.fileName}
                              className="max-h-96 w-full object-cover"
                              src={attachment.url}
                            />
                            <span className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300">
                              <Paperclip size={13} />
                              {attachment.fileName}
                            </span>
                          </a>
                        ) : (
                          <a
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-orange-500/60 hover:text-orange-300"
                            href={attachment.url}
                            key={attachment.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Paperclip size={13} />
                            {attachment.fileName}
                          </a>
                        ),
                      )}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["👍", "🎉", "🔥"].map((emoji) => {
                      const count =
                        getReactionGroups(announcement.reactions)[emoji] || 0;

                      return (
                        <button
                          className="rounded-full border border-white/10 px-3 py-1 text-sm transition hover:border-orange-500/60 hover:text-orange-300"
                          disabled={
                            pendingReactions[`${announcement.id}:${emoji}`]
                          }
                          key={emoji}
                          onClick={() => handleReaction(announcement.id, emoji)}
                          type="button"
                        >
                          {emoji} {count}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <button
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-gray-300 transition hover:border-orange-500/60 hover:text-orange-300"
                      disabled={pendingAnnouncements[announcement.id]}
                      onClick={() => togglePinned(announcement)}
                      type="button"
                    >
                      <Pin size={15} />
                      {announcement.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-orange-500/50 hover:text-orange-300"
                      disabled={pendingAnnouncements[announcement.id]}
                      onClick={() => openEditModal(announcement)}
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-red-500/50 hover:text-red-300"
                      disabled={pendingAnnouncements[announcement.id]}
                      onClick={() => handleDelete(announcement.id)}
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mt-5 rounded-xl border border-white/10 bg-gray-950/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <MessageCircle size={16} />
                  Comments
                </div>
                <div className="space-y-3">
                  {(announcement.comments || []).map((comment) => (
                    <div
                      className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                      key={comment.id}
                    >
                      <p className="text-sm leading-6 text-gray-200">
                        {comment.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {comment.author?.name || "Team member"} ·{" "}
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm text-white outline-none focus:border-orange-500"
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [announcement.id]: event.target.value,
                      }))
                    }
                    placeholder="Comment or mention @teammate@example.com"
                    value={commentDrafts[announcement.id] || ""}
                  />
                  <button
                    className="h-10 rounded-lg px-4 text-sm font-bold text-gray-950 transition hover:brightness-110"
                    onClick={() => handleComment(announcement.id)}
                    disabled={pendingComments[announcement.id]}
                    style={{ backgroundColor: accentColor }}
                    type="button"
                  >
                    Comment
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
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">
                {editingAnnouncement
                  ? "Edit announcement"
                  : "Publish announcement"}
              </h3>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white"
                onClick={closeModal}
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

            {!editingAnnouncement ? (
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-gray-300 transition hover:border-orange-500/60 hover:text-orange-300">
                <Paperclip size={16} />
                <span className="truncate">
                  {attachmentFile?.name || "Attach a file"}
                </span>
                <input
                  className="hidden"
                  onChange={(event) =>
                    setAttachmentFile(event.target.files?.[0] || null)
                  }
                  type="file"
                />
              </label>
            ) : null}

            <button
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold text-gray-950 transition hover:brightness-110 disabled:opacity-60"
              disabled={isLoading || isSubmitting}
              style={{ backgroundColor: accentColor }}
              type="submit"
            >
              {isLoading || isSubmitting
                ? editingAnnouncement
                  ? "Saving..."
                  : "Publishing..."
                : editingAnnouncement
                  ? "Save announcement"
                  : "Publish announcement"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
