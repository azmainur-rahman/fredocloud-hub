let ioInstance;
const workspacePresence = new Map();

const getRoomName = (workspaceId) => `workspace:${workspaceId}`;
const getUserRoomName = (userId) => `user:${userId}`;

const emitPresence = (workspaceId) => {
  if (!ioInstance || !workspaceId) {
    return;
  }

  const members = Array.from(
    workspacePresence.get(workspaceId)?.values() || [],
  );

  ioInstance.to(getRoomName(workspaceId)).emit("workspace_presence", {
    workspaceId,
    members,
  });
};

const leaveTrackedWorkspace = (socket) => {
  const { workspaceId, userId } = socket.data;

  if (!workspaceId || !userId) {
    return;
  }

  const members = workspacePresence.get(workspaceId);

  if (members) {
    members.delete(userId);

    if (members.size === 0) {
      workspacePresence.delete(workspaceId);
    }
  }

  socket.leave(getRoomName(workspaceId));
  socket.data.workspaceId = null;
  socket.data.userId = null;
  emitPresence(workspaceId);
};

export const initSocket = (server) => {
  ioInstance = server;

  ioInstance.on("connection", (socket) => {
    const { workspaceId, userId, name, avatarUrl } = socket.handshake.query;

    if (workspaceId) {
      socket.join(getRoomName(workspaceId));
    }

    if (workspaceId && userId) {
      socket.data.workspaceId = workspaceId;
      socket.data.userId = userId;

      if (!workspacePresence.has(workspaceId)) {
        workspacePresence.set(workspaceId, new Map());
      }

      workspacePresence.get(workspaceId).set(userId, {
        id: userId,
        name: name || "Team member",
        avatarUrl: avatarUrl || null,
      });

      emitPresence(workspaceId);
    }

    if (userId) {
      socket.join(getUserRoomName(userId));
    }

    socket.on("join_user", (userId) => {
      if (userId) {
        socket.join(getUserRoomName(userId));
      }
    });

    socket.on("join_workspace", (payload) => {
      const nextWorkspaceId =
        typeof payload === "string" ? payload : payload?.workspaceId;
      const nextUser = typeof payload === "object" ? payload?.user : null;

      leaveTrackedWorkspace(socket);

      if (nextWorkspaceId) {
        socket.join(getRoomName(nextWorkspaceId));
      }

      if (nextWorkspaceId && nextUser?.id) {
        socket.data.workspaceId = nextWorkspaceId;
        socket.data.userId = nextUser.id;

        if (!workspacePresence.has(nextWorkspaceId)) {
          workspacePresence.set(nextWorkspaceId, new Map());
        }

        workspacePresence.get(nextWorkspaceId).set(nextUser.id, {
          id: nextUser.id,
          name: nextUser.name || "Team member",
          avatarUrl: nextUser.avatarUrl || null,
        });

        emitPresence(nextWorkspaceId);
      }
    });

    socket.on("leave_workspace", (workspaceId) => {
      if (workspaceId) {
        leaveTrackedWorkspace(socket);
      }
    });

    socket.on("disconnect", () => {
      leaveTrackedWorkspace(socket);
    });
  });
};

export const emitToWorkspace = (workspaceId, event, payload) => {
  if (ioInstance && workspaceId) {
    ioInstance.to(getRoomName(workspaceId)).emit(event, payload);
  }
};

export const emitToUser = (userId, event, payload) => {
  if (ioInstance && userId) {
    ioInstance.to(getUserRoomName(userId)).emit(event, payload);
  }
};
