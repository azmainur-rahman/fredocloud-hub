let ioInstance;

export const initSocket = (server) => {
  ioInstance = server;

  ioInstance.on("connection", (socket) => {
    const { workspaceId } = socket.handshake.query;

    if (workspaceId) {
      socket.join(`workspace:${workspaceId}`);
    }

    socket.on("join_workspace", (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
      }
    });

    socket.on("leave_workspace", (workspaceId) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });
  });
};

export const emitToWorkspace = (workspaceId, event, payload) => {
  if (ioInstance && workspaceId) {
    ioInstance.to(`workspace:${workspaceId}`).emit(event, payload);
  }
};
