import prisma from "../utils/prisma.js";

export const createWorkspace = async (req, res) => {
  try {
    const { name, description, accentColor } = req.body;

    if (!name || !description || !accentColor) {
      return res
        .status(400)
        .json({ message: "Name, description, and accent color are required." });
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
