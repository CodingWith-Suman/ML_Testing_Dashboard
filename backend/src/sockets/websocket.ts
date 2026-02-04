import { WebSocket, WebSocketServer } from "ws";
import http from "http";

export const socketsById = new Map<string, WebSocket>();

export const setupWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let currentId = "";

    ws.on("message", (message) => {
      try {
        const parsed = JSON.parse(message.toString());

        if (typeof parsed.id === "string" && parsed.id.trim() !== "") {
          currentId = parsed.id.trim();
          socketsById.set(currentId, ws);
          console.log(`WebSocket connection registered for ID: ${currentId}`);
        } else {
          console.warn("Received invalid ID format:", parsed.id);
        }
      } catch (err) {
        console.error(`Invalid WebSocket message: ${message}`);
      }
    });

    ws.on("close", () => {
      if (currentId) {
        socketsById.delete(currentId);
        console.log(`WebSocket closed for ID: ${currentId}`);
      }
    });

    ws.on("error", (err) => {
      console.error(`WebSocket error for ID ${currentId}:`, err);
    });
  });
};
