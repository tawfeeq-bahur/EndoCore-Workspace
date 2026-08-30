import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

/**
 * Returns a shared, singleton Socket.io client instance for the workspace.
 * Avoids creating duplicate sockets and prevents connection flapping on component mount/unmount.
 */
export function getSocket(): Socket | null {
  const token = localStorage.getItem("token") || localStorage.getItem("endocore_token");
  if (!token) return null;

  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io({
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }

  return socketInstance;
}

/**
 * Disconnects and clears the shared socket instance (e.g., on logout).
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
