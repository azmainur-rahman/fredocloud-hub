import prisma from "../utils/prisma.js";
import { emitToWorkspace } from "../utils/socket.js";

const priorities = ["LOW", "MEDIUM", "HIGH"];
const itemStatuses = ["TODO", "IN_PROGRESS", "DONE"];

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

const getWorkspaceMembership = async (workspaceId, userId, tx = prisma) => {
  const membership = await tx.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  return membership;
};

const ensureWorkspaceMember = async (workspaceId, userId, tx = prisma) =>
  Boolean(await getWorkspaceMembership(workspaceId, userId, tx));

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

const isValidDate = (value) => {
  const date = new Date(value);

  return value && !Number.isNaN(date.getTime());
};

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
    const title = req.body.title?.trim();
    const { priority, status, dueDate, assigneeId, goalId } = req.body;

    if (!title || !dueDate || !goalId) {
      return res
        .status(400)
        .json({ message: "Title, due date, and goal are required." });
    }

    if (priority && !priorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority." });
    }

    if (status && !itemStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid item status." });
    }

    if (!isValidDate(dueDate)) {
      return res.status(400).json({ message: "Due date is invalid." });
    }

    const actionItem = await prisma.$transaction(async (tx) => {
      const membership = await getWorkspaceMembership(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!membership) {
        return null;
      }

      const resolvedAssigneeId = assigneeId || req.user.id;

      if (assigneeId) {
        const assigneeMembership = await tx.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: assigneeId,
              workspaceId,
            },
          },
        });

        if (!assigneeMembership) {
          return "missing-assignee";
        }
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
          assigneeId: resolvedAssigneeId,
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

    if (actionItem === "missing-assignee") {
      return res
        .status(400)
        .json({ message: "Assignee must be a workspace member." });
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
    const title = req.body.title?.trim();
    const { priority, status, dueDate, assigneeId, goalId } = req.body;

    if (req.body.title !== undefined && !title) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    if (priority !== undefined && !priorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority." });
    }

    if (status !== undefined && !itemStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid item status." });
    }

    if (dueDate !== undefined && !isValidDate(dueDate)) {
      return res.status(400).json({ message: "Due date is invalid." });
    }

    const actionItem = await prisma.$transaction(async (tx) => {
      const membership = await getWorkspaceMembership(
        workspaceId,
        req.user.id,
        tx,
      );

      if (!membership) {
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

      if (assigneeId) {
        const assigneeMembership = await tx.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: assigneeId,
              workspaceId,
            },
          },
        });

        if (!assigneeMembership) {
          return "missing-assignee";
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

    if (actionItem === "missing-assignee") {
      return res
        .status(400)
        .json({ message: "Assignee must be a workspace member." });
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

    if (deleted === "delete-forbidden") {
      return res
        .status(403)
        .json({ message: "Only admins can delete action items." });
    }

    emitToWorkspace(workspaceId, "action_item_deleted", { actionItemId });

    return res.json({ message: "Action item deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete action item." });
  }
};
