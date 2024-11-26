import { Server } from "socket.io";

/**
 * @type {Server}
 */
let io;
const connectedClients = {};

export default function initSocketIO(server) {
  io = new Server(server);

  io.on("connection", (socket) => {
    console.log(`a client ${socket.id} connected`);
    connectedClients[socket.id] = socket;

    socket.on("disconnect", () => {
      console.log(`client ${socket.id} disconnected`);
      delete connectedClients[socket.id];
    });

    socket.on("assigned", (data) => {
      const newData = { ...data };
      newData.state = true;
      socket.broadcast.emit("getEmailStateChanged", newData);
    });

    socket.on("unassigned", (data) => {
      const newData = { ...data };
      newData.state = false;
      socket.broadcast.emit("getEmailStateChanged", newData);
    });

    socket.on("newSenderEmail", (data) => {
      socket.broadcast.emit("newSenderEmail", data);
    });

    socket.on("unassignAll", () => {
      socket.broadcast.emit("unassignAll");
    });

    socket.on("deleteSender", (email) => {
      socket.broadcast.emit("deleteSender", email);
    });

    socket.on("renameAgent", (data) => {
      socket.broadcast.emit("renameAgent", data);
    });
  });
}

export { io, connectedClients };
