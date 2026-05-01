import prisma from "../utils/prisma.js";
import { emitToWorkspace } from "../utils/socket.js";

const goalInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  milestones: {
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

const normalizeMilestones = (milestones) =>
  Array.isArray(milestones)
    ? milestones
        .filter((milestone) => milestone.title)
        .map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
          progressPercentage: Number(milestone.progressPercentage || 0),
        }))
    : [];

export const getGoals = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const hasAccess = await ensureWorkspaceMember(workspaceId, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const goals = await prisma.goal.findMany({
      where: { workspaceId },
      include: goalInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ goals });
  } catch {
    return res.status(500).json({ message: "Failed to fetch goals." });
  }
};

export const getGoal = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const hasAccess = await ensureWorkspaceMember(workspaceId, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, workspaceId },
      include: goalInclude,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    return res.json({ goal });
  } catch {
    return res.status(500).json({ message: "Failed to fetch goal." });
  }
};

export const createGoal = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, dueDate, ownerId, milestones } =
      req.body;

    if (!title || !description || !dueDate) {
      return res
        .status(400)
        .json({ message: "Title, description, and due date are required." });
    }

    const goal = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const createdGoal = await tx.goal.create({
        data: {
          title,
          description,
          status: status || "PENDING",
          dueDate: new Date(dueDate),
          ownerId: ownerId || req.user.id,
          workspaceId,
          milestones: {
            create: normalizeMilestones(milestones).map((milestone) => ({
              title: milestone.title,
              progressPercentage: milestone.progressPercentage,
            })),
          },
        },
        include: goalInclude,
      });

      await createAuditLog(tx, {
        action: "GOAL_CREATED",
        details: { goalId: createdGoal.id, title: createdGoal.title },
        userId: req.user.id,
        workspaceId,
      });

      return createdGoal;
    });

    if (!goal) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    emitToWorkspace(workspaceId, "goal_created", { goal });

    return res.status(201).json({ goal });
  } catch {
    return res.status(500).json({ message: "Failed to create goal." });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const { title, description, status, dueDate, ownerId, milestones } =
      req.body;

    const goal = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const existingGoal = await tx.goal.findFirst({
        where: { id: goalId, workspaceId },
      });

      if (!existingGoal) {
        return false;
      }

      const milestonePayload = normalizeMilestones(milestones);
      const data = {};

      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (status !== undefined) data.status = status;
      if (dueDate !== undefined) data.dueDate = new Date(dueDate);
      if (ownerId !== undefined) data.ownerId = ownerId;

      if (Array.isArray(milestones)) {
        const existingMilestoneIds = milestonePayload
          .filter((milestone) => milestone.id)
          .map((milestone) => milestone.id);

        await tx.milestone.deleteMany({
          where: {
            goalId,
            id: { notIn: existingMilestoneIds },
          },
        });

        await Promise.all(
          milestonePayload.map((milestone) =>
            milestone.id
              ? tx.milestone.update({
                  where: { id: milestone.id },
                  data: {
                    title: milestone.title,
                    progressPercentage: milestone.progressPercentage,
                  },
                })
              : tx.milestone.create({
                  data: {
                    title: milestone.title,
                    progressPercentage: milestone.progressPercentage,
                    goalId,
                  },
                }),
          ),
        );
      }

      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data,
        include: goalInclude,
      });

      await createAuditLog(tx, {
        action: "GOAL_UPDATED",
        details: { goalId: updatedGoal.id, title: updatedGoal.title },
        userId: req.user.id,
        workspaceId,
      });

      return updatedGoal;
    });

    if (goal === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (goal === false) {
      return res.status(404).json({ message: "Goal not found." });
    }

    emitToWorkspace(workspaceId, "goal_updated", { goal });

    return res.json({ goal });
  } catch {
    return res.status(500).json({ message: "Failed to update goal." });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;

    const deleted = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const existingGoal = await tx.goal.findFirst({
        where: { id: goalId, workspaceId },
      });

      if (!existingGoal) {
        return false;
      }

      await createAuditLog(tx, {
        action: "GOAL_DELETED",
        details: { goalId: existingGoal.id, title: existingGoal.title },
        userId: req.user.id,
        workspaceId,
      });

      await tx.goal.delete({ where: { id: goalId } });

      return true;
    });

    if (deleted === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (deleted === false) {
      return res.status(404).json({ message: "Goal not found." });
    }

    emitToWorkspace(workspaceId, "goal_deleted", { goalId });

    return res.json({ message: "Goal deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete goal." });
  }
};
