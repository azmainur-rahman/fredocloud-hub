import prisma from "../utils/prisma.js";
import { emitToWorkspace } from "../utils/socket.js";

const announcementInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  comments: {
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  reactions: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

const ensureWorkspaceMember = async (workspaceId, userId, tx = prisma) => {
  const membership = await tx.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  return Boolean(membership);
};

const createAuditLog = (tx, { action, details, userId, workspaceId }) =>
  tx.auditLog.create({
    data: {
      action,
      details,
      userId,
      workspaceId,
    },
  });

const attachAnnouncementFiles = async (workspaceId, announcements) => {
  const attachmentRows = await prisma.attachment.findMany({
    where: {
      workspaceId,
      entityType: "ANNOUNCEMENT",
      entityId: { in: announcements.map((announcement) => announcement.id) },
    },
    orderBy: { createdAt: "desc" },
  });

  return announcements.map((announcement) => ({
    ...announcement,
    attachments: attachmentRows.filter(
      (attachment) => attachment.entityId === announcement.id,
    ),
  }));
};

export const getAnnouncements = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const hasAccess = await ensureWorkspaceMember(workspaceId, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const announcements = await prisma.announcement.findMany({
      where: { workspaceId },
      include: announcementInclude,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    const announcementsWithAttachments = await attachAnnouncementFiles(
      workspaceId,
      announcements,
    );

    return res.json({ announcements: announcementsWithAttachments });
  } catch {
    return res.status(500).json({ message: "Failed to fetch announcements." });
  }
};

export const getAnnouncement = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const hasAccess = await ensureWorkspaceMember(workspaceId, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const announcement = await prisma.announcement.findFirst({
      where: { id: announcementId, workspaceId },
      include: announcementInclude,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    const [announcementWithAttachments] = await attachAnnouncementFiles(
      workspaceId,
      [announcement],
    );

    return res.json({ announcement: announcementWithAttachments });
  } catch {
    return res.status(500).json({ message: "Failed to fetch announcement." });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const content = req.body.content?.trim();
    const { pinned } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const createdAnnouncement = await tx.announcement.create({
        data: {
          content,
          pinned: Boolean(pinned),
          authorId: req.user.id,
          workspaceId,
        },
        include: announcementInclude,
      });

      await createAuditLog(tx, {
        action: "ANNOUNCEMENT_CREATED",
        details: {
          announcementId: createdAnnouncement.id,
          pinned: createdAnnouncement.pinned,
        },
        userId: req.user.id,
        workspaceId,
      });

      return createdAnnouncement;
    });

    if (!announcement) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    emitToWorkspace(workspaceId, "announcement_posted", { announcement });

    return res.status(201).json({ announcement });
  } catch {
    return res.status(500).json({ message: "Failed to create announcement." });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const content = req.body.content?.trim();
    const { pinned } = req.body;

    if (req.body.content !== undefined && !content) {
      return res.status(400).json({ message: "Content cannot be empty." });
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const existingAnnouncement = await tx.announcement.findFirst({
        where: { id: announcementId, workspaceId },
      });

      if (!existingAnnouncement) {
        return false;
      }

      const data = {};

      if (content !== undefined) data.content = content;
      if (pinned !== undefined) data.pinned = Boolean(pinned);

      const updatedAnnouncement = await tx.announcement.update({
        where: { id: announcementId },
        data,
        include: announcementInclude,
      });

      await createAuditLog(tx, {
        action: "ANNOUNCEMENT_UPDATED",
        details: {
          announcementId: updatedAnnouncement.id,
          pinned: updatedAnnouncement.pinned,
        },
        userId: req.user.id,
        workspaceId,
      });

      return updatedAnnouncement;
    });

    if (announcement === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (announcement === false) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    emitToWorkspace(workspaceId, "announcement_updated", { announcement });

    return res.json({ announcement });
  } catch {
    return res.status(500).json({ message: "Failed to update announcement." });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;

    const deleted = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const existingAnnouncement = await tx.announcement.findFirst({
        where: { id: announcementId, workspaceId },
      });

      if (!existingAnnouncement) {
        return false;
      }

      await createAuditLog(tx, {
        action: "ANNOUNCEMENT_DELETED",
        details: {
          announcementId: existingAnnouncement.id,
          pinned: existingAnnouncement.pinned,
        },
        userId: req.user.id,
        workspaceId,
      });

      await tx.announcement.delete({ where: { id: announcementId } });

      return true;
    });

    if (deleted === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (deleted === false) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    emitToWorkspace(workspaceId, "announcement_deleted", { announcementId });

    return res.json({ message: "Announcement deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete announcement." });
  }
};

const getMentionedEmails = (content) =>
  Array.from(
    new Set(
      (content.match(/@[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map(
        (mention) => mention.slice(1).toLowerCase(),
      ),
    ),
  );

export const createAnnouncementComment = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({ message: "Comment is required." });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const announcement = await tx.announcement.findFirst({
        where: { id: announcementId, workspaceId },
        select: { id: true },
      });

      if (!announcement) {
        return false;
      }

      const createdComment = await tx.announcementComment.create({
        data: {
          content,
          announcementId,
          authorId: req.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      const mentionedEmails = getMentionedEmails(content);

      if (mentionedEmails.length > 0) {
        const mentionedUsers = await tx.user.findMany({
          where: {
            email: { in: mentionedEmails },
            memberships: { some: { workspaceId } },
            id: { not: req.user.id },
          },
          select: { id: true },
        });

        await Promise.all(
          mentionedUsers.map((user) =>
            tx.notification.create({
              data: {
                message: `${req.user.name} mentioned you in an announcement comment`,
                userId: user.id,
              },
            }),
          ),
        );
      }

      await createAuditLog(tx, {
        action: "ANNOUNCEMENT_COMMENTED",
        details: { announcementId, commentId: createdComment.id },
        userId: req.user.id,
        workspaceId,
      });

      return createdComment;
    });

    if (comment === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (comment === false) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    emitToWorkspace(workspaceId, "announcement_comment_created", {
      announcementId,
      comment,
    });

    return res.status(201).json({ comment });
  } catch {
    return res.status(500).json({ message: "Failed to create comment." });
  }
};

export const toggleAnnouncementReaction = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const emoji = req.body.emoji?.trim();

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const announcement = await tx.announcement.findFirst({
        where: { id: announcementId, workspaceId },
        select: { id: true },
      });

      if (!announcement) {
        return false;
      }

      const existingReaction = await tx.announcementReaction.findUnique({
        where: {
          announcementId_userId_emoji: {
            announcementId,
            userId: req.user.id,
            emoji,
          },
        },
      });

      if (existingReaction) {
        await tx.announcementReaction.delete({
          where: { id: existingReaction.id },
        });

        return { removed: true, reaction: existingReaction };
      }

      const reaction = await tx.announcementReaction.create({
        data: {
          emoji,
          announcementId,
          userId: req.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      await createAuditLog(tx, {
        action: "ANNOUNCEMENT_REACTED",
        details: { announcementId, reactionId: reaction.id, emoji },
        userId: req.user.id,
        workspaceId,
      });

      return { removed: false, reaction };
    });

    if (result === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (result === false) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    emitToWorkspace(workspaceId, "announcement_reaction_changed", {
      announcementId,
      ...result,
    });

    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to update reaction." });
  }
};
