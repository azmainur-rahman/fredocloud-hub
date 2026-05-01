import prisma from "../utils/prisma.js";
import { emitToWorkspace } from "../utils/socket.js";

const actionItemInclude = {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  goal: {
    select: {
      id: true,
      title: true,
      workspaceId: true,
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

const ensureGoalInWorkspace = async (goalId, workspaceId, tx = prisma) =>
  tx.goal.findFirst({
    where: {
      id: goalId,
      workspaceId,
    },
    select: { id: true },
  });

export const getActionItems = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const hasAccess = await ensureWorkspaceMember(workspaceId, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const actionItems = await prisma.actionItem.findMany({
      where: {
        goal: { workspaceId },
      },
      include: actionItemInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return res.json({ actionItems });
  } catch {
    return res.status(500).json({ message: "Failed to fetch action items." });
  }
};

export const getActionItem = async (req, res) => {
  try {
    const { workspaceId, actionItemId } = req.params;
    const hasAccess = await ensureWorkspaceMember(workspaceId, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    const actionItem = await prisma.actionItem.findFirst({
      where: {
        id: actionItemId,
        goal: { workspaceId },
      },
      include: actionItemInclude,
    });

    if (!actionItem) {
      return res.status(404).json({ message: "Action item not found." });
    }

    return res.json({ actionItem });
  } catch {
    return res.status(500).json({ message: "Failed to fetch action item." });
  }
};

export const createActionItem = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, priority, status, dueDate, assigneeId, goalId } = req.body;

    if (!title || !dueDate || !goalId) {
      return res
        .status(400)
        .json({ message: "Title, due date, and goal are required." });
    }

    const actionItem = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const goal = await ensureGoalInWorkspace(goalId, workspaceId, tx);

      if (!goal) {
        return false;
      }

      const createdActionItem = await tx.actionItem.create({
        data: {
          title,
          priority: priority || "MEDIUM",
          status: status || "TODO",
          dueDate: new Date(dueDate),
          assigneeId: assigneeId || req.user.id,
          goalId,
        },
        include: actionItemInclude,
      });

      await createAuditLog(tx, {
        action: "ACTION_ITEM_CREATED",
        details: {
          actionItemId: createdActionItem.id,
          title: createdActionItem.title,
          goalId,
        },
        userId: req.user.id,
        workspaceId,
      });

      return createdActionItem;
    });

    if (actionItem === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (actionItem === false) {
      return res.status(404).json({ message: "Goal not found." });
    }

    emitToWorkspace(workspaceId, "action_item_created", { actionItem });

    return res.status(201).json({ actionItem });
  } catch {
    return res.status(500).json({ message: "Failed to create action item." });
  }
};

export const updateActionItem = async (req, res) => {
  try {
    const { workspaceId, actionItemId } = req.params;
    const { title, priority, status, dueDate, assigneeId, goalId } = req.body;

    const actionItem = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const existingActionItem = await tx.actionItem.findFirst({
        where: {
          id: actionItemId,
          goal: { workspaceId },
        },
      });

      if (!existingActionItem) {
        return false;
      }

      if (goalId) {
        const goal = await ensureGoalInWorkspace(goalId, workspaceId, tx);

        if (!goal) {
          return "missing-goal";
        }
      }

      const data = {};

      if (title !== undefined) data.title = title;
      if (priority !== undefined) data.priority = priority;
      if (status !== undefined) data.status = status;
      if (dueDate !== undefined) data.dueDate = new Date(dueDate);
      if (assigneeId !== undefined) data.assigneeId = assigneeId;
      if (goalId !== undefined) data.goalId = goalId;

      const updatedActionItem = await tx.actionItem.update({
        where: { id: actionItemId },
        data,
        include: actionItemInclude,
      });

      await createAuditLog(tx, {
        action: "ACTION_ITEM_UPDATED",
        details: {
          actionItemId: updatedActionItem.id,
          title: updatedActionItem.title,
          status: updatedActionItem.status,
        },
        userId: req.user.id,
        workspaceId,
      });

      return updatedActionItem;
    });

    if (actionItem === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (actionItem === false) {
      return res.status(404).json({ message: "Action item not found." });
    }

    if (actionItem === "missing-goal") {
      return res.status(404).json({ message: "Goal not found." });
    }

    emitToWorkspace(workspaceId, "action_item_updated", { actionItem });

    if (status !== undefined) {
      emitToWorkspace(workspaceId, "item_status_changed", { actionItem });
    }

    return res.json({ actionItem });
  } catch {
    return res.status(500).json({ message: "Failed to update action item." });
  }
};

export const deleteActionItem = async (req, res) => {
  try {
    const { workspaceId, actionItemId } = req.params;

    const deleted = await prisma.$transaction(async (tx) => {
      const hasAccess = await ensureWorkspaceMember(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!hasAccess) {
        return null;
      }

      const existingActionItem = await tx.actionItem.findFirst({
        where: {
          id: actionItemId,
          goal: { workspaceId },
        },
      });

      if (!existingActionItem) {
        return false;
      }

      await createAuditLog(tx, {
        action: "ACTION_ITEM_DELETED",
        details: {
          actionItemId: existingActionItem.id,
          title: existingActionItem.title,
        },
        userId: req.user.id,
        workspaceId,
      });

      await tx.actionItem.delete({ where: { id: actionItemId } });

      return true;
    });

    if (deleted === null) {
      return res.status(403).json({ message: "Workspace access denied." });
    }

    if (deleted === false) {
      return res.status(404).json({ message: "Action item not found." });
    }

    emitToWorkspace(workspaceId, "action_item_deleted", { actionItemId });

    return res.json({ message: "Action item deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete action item." });
  }
};
