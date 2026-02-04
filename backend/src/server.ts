// import http from "http";
// import app from ".";
// import { setupWebSocket } from "./sockets/websocket";
// const PORT = 3000;
// const server = http.createServer(app);

// setupWebSocket(server);
// server.listen(PORT, () => {
//   console.log(`Express server running at http://localhost:${PORT}`);
// });


// src/server.ts
import path from "path";
import dotenv from "dotenv";

// Load backend/.env before anything else
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import http from "http";
import app from ".";
import { setupWebSocket } from "./sockets/websocket";

const PORT = 3000;
const server = http.createServer(app);

setupWebSocket(server);
server.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});
