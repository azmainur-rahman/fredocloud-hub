import prisma from "../utils/prisma.js";
import { emitToUser, emitToWorkspace } from "../utils/socket.js";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createWorkspace = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const accentColor = req.body.accentColor?.trim();

    if (!name || !description || !accentColor) {
      return res
        .status(400)
        .json({ message: "Name, description, and accent color are required." });
    }

    if (!hexColorRegex.test(accentColor)) {
      return res
        .status(400)
        .json({ message: "Accent color must be a hex code." });
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          name,
          description,
          accentColor,
        },
      });

      const membership = await tx.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: createdWorkspace.id,
          role: "ADMIN",
        },
      });

      return { ...createdWorkspace, role: membership.role };
    });

    return res.status(201).json({ workspace });
  } catch {
    return res.status(500).json({ message: "Failed to create workspace." });
  }
};

export const getUserWorkspaces = async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    const workspaces = memberships.map((membership) => ({
      ...membership.workspace,
      role: membership.role,
    }));

    return res.json({ workspaces });
  } catch {
    return res.status(500).json({ message: "Failed to fetch workspaces." });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const hasAccess = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId,
        },
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const members = memberships.map((membership) => ({
      ...membership.user,
      role: membership.role,
      joinedAt: membership.createdAt,
    }));

    return res.json({ members });
  } catch {
    return res.status(500).json({ message: "Failed to fetch members." });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const hasAccess = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId,
        },
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { workspaceId },
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
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return res.json({ auditLogs });
  } catch {
    return res.status(500).json({ message: "Failed to fetch audit logs." });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const accentColor = req.body.accentColor?.trim();

    if (!name || !description || !accentColor) {
      return res
        .status(400)
        .json({ message: "Name, description, and accent color are required." });
    }

    if (!hexColorRegex.test(accentColor)) {
      return res
        .status(400)
        .json({ message: "Accent color must be a hex code." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingWorkspace = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!existingWorkspace) {
        return null;
      }

      const workspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { name, description, accentColor },
      });

      const membership = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "WORKSPACE_UPDATED",
          details: { workspaceId, name, description, accentColor },
          userId: req.user.id,
          workspaceId,
        },
      });

      return { workspace, role: membership?.role || "ADMIN" };
    });

    if (!result) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const workspace = { ...result.workspace, role: result.role };

    emitToWorkspace(workspaceId, "workspace_updated", {
      workspace: result.workspace,
    });

    return res.json({ workspace });
  } catch {
    return res.status(500).json({ message: "Failed to update workspace." });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const email = req.body.email?.trim().toLowerCase();
    const role = req.body.role?.trim();

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required." });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "Role must be ADMIN or MEMBER." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot invite or change your own role." });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingMembership = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
      });

      if (existingMembership?.role === "ADMIN" && role === "MEMBER") {
        const adminCount = await tx.workspaceMember.count({
          where: { workspaceId, role: "ADMIN" },
        });

        if (adminCount <= 1) {
          return "last-admin";
        }
      }

      const createdMembership = await tx.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
        update: { role },
        create: {
          userId: user.id,
          workspaceId,
          role,
        },
      });

      const notification = await tx.notification.create({
        data: {
          message: `You have been added to workspace ${workspace.name}`,
          userId: user.id,
        },
      });

      return { membership: createdMembership, notification };
    });

    if (result === "last-admin") {
      return res
        .status(400)
        .json({ message: "A workspace must always have at least one admin." });
    }

    emitToUser(user.id, "notification_created", {
      notification: result.notification,
    });
    emitToUser(user.id, "workspace_invited", { workspaceId });
    emitToWorkspace(workspaceId, "member_invited", {
      member: { ...user, role: result.membership.role },
    });

    return res
      .status(201)
      .json({ member: { ...user, role: result.membership.role } });
  } catch {
    return res.status(500).json({ message: "Failed to invite member." });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    await prisma.auditLog.create({
      data: {
        action: "WORKSPACE_DELETED",
        details: { workspaceId: workspace.id, name: workspace.name },
        userId: req.user.id,
        workspaceId,
      },
    });

    await prisma.workspace.delete({ where: { id: workspaceId } });

    emitToWorkspace(workspaceId, "workspace_deleted", { workspaceId });

    return res.json({ message: "Workspace deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete workspace." });
  }
};
