import prisma from "../utils/prisma.js";

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

      await tx.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: createdWorkspace.id,
          role: "ADMIN",
        },
      });

      return createdWorkspace;
    });

    return res.status(201).json({ workspace: { ...workspace, role: "ADMIN" } });
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const membership = await prisma.$transaction(async (tx) => {
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

      await tx.notification.create({
        data: {
          message: `You have been added to workspace ${workspace.name}`,
          userId: user.id,
        },
      });

      return createdMembership;
    });

    return res.status(201).json({ member: { ...user, role: membership.role } });
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

    return res.json({ message: "Workspace deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete workspace." });
  }
};
