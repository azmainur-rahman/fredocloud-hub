import prisma from "../utils/prisma.js";
import { emitToWorkspace } from "../utils/socket.js";

const goalStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];

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
  updates: {
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
    orderBy: { createdAt: "desc" },
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

const getWorkspaceMembership = async (workspaceId, userId, tx = prisma) =>
  tx.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

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
        .filter((milestone) => milestone.title?.trim())
        .map((milestone) => ({
          id: milestone.id,
          title: milestone.title.trim(),
          progressPercentage: Math.min(
            100,
            Math.max(0, Number(milestone.progressPercentage || 0)),
          ),
        }))
    : [];

const isValidDate = (value) => {
  const date = new Date(value);

  return value && !Number.isNaN(date.getTime());
};

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
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const { status, dueDate, ownerId, milestones } = req.body;

    if (!title || !description || !dueDate) {
      return res
        .status(400)
        .json({ message: "Title, description, and due date are required." });
    }

    if (status && !goalStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid goal status." });
    }

    if (!isValidDate(dueDate)) {
      return res.status(400).json({ message: "Due date is invalid." });
    }

    const goal = await prisma.$transaction(async (tx) => {
      const membership = await getWorkspaceMembership(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!membership) {
        return null;
      }

      if (ownerId) {
        const ownerMembership = await tx.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: ownerId,
              workspaceId,
            },
          },
        });

        if (!ownerMembership) {
          return "missing-owner";
        }
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

    if (goal === "missing-owner") {
      return res
        .status(400)
        .json({ message: "Owner must be a workspace member." });
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
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const { status, dueDate, ownerId, milestones } = req.body;

    if (req.body.title !== undefined && !title) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    if (req.body.description !== undefined && !description) {
      return res.status(400).json({ message: "Description cannot be empty." });
    }

    if (status !== undefined && !goalStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid goal status." });
    }

    if (dueDate !== undefined && !isValidDate(dueDate)) {
      return res.status(400).json({ message: "Due date is invalid." });
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

      const existingGoal = await tx.goal.findFirst({
        where: { id: goalId, workspaceId },
      });

      if (!existingGoal) {
        return false;
      }

      if (ownerId) {
        const ownerMembership = await tx.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: ownerId,
              workspaceId,
            },
          },
        });

        if (!ownerMembership) {
          return "missing-owner";
        }
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
      } else if (status === "COMPLETED" || status === "PENDING") {
        await tx.milestone.updateMany({
          where: { goalId },
          data: {
            progressPercentage: status === "COMPLETED" ? 100 : 0,
          },
        });
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

    if (goal === "missing-owner") {
      return res
        .status(400)
        .json({ message: "Owner must be a workspace member." });
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
      const membership = await getWorkspaceMembership(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!membership) {
        return null;
      }

      if (membership.role !== "ADMIN") {
        return "delete-forbidden";
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

    if (deleted === "delete-forbidden") {
      return res.status(403).json({ message: "Only admins can delete goals." });
    }

    emitToWorkspace(workspaceId, "goal_deleted", { goalId });

    return res.json({ message: "Goal deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete goal." });
  }
};

export const createGoalUpdate = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({ message: "Progress update is required." });
    }

    const goalUpdate = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const goal = await tx.goal.findFirst({
        where: { id: goalId, workspaceId },
        select: { id: true, title: true },
      });

      if (!goal) {
        return false;
      }

      const createdGoalUpdate = await tx.goalUpdate.create({
        data: {
          content,
          goalId,
          authorId: req.user.id,
          workspaceId,
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

      await createAuditLog(tx, {
        action: "GOAL_PROGRESS_POSTED",
        details: {
          goalId,
          goalTitle: goal.title,
          updateId: createdGoalUpdate.id,
        },
        userId: req.user.id,
        workspaceId,
      });

      return createdGoalUpdate;
    });

    if (goalUpdate === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (goalUpdate === false) {
      return res.status(404).json({ message: "Goal not found." });
    }

    emitToWorkspace(workspaceId, "goal_update_created", {
      goalId,
      goalUpdate,
    });

    return res.status(201).json({ goalUpdate });
  } catch {
    return res.status(500).json({ message: "Failed to post progress update." });
  }
};
