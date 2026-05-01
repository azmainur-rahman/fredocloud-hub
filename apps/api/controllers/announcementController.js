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

    return res.json({ announcements });
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

    return res.json({ announcement });
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
