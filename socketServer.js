const express = require("express");
const http = require("http");
const { Server } = require("ws");
const servoControl = require("./servoControlLoop");

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

wss.on("connection", ws => {
  console.log("Client connected");
  
  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);
      servoControl.setTarget(data.pan, data.tilt);
      
      // Send confirmation back to client
      ws.send(JSON.stringify({
        status: "ok",
        position: servoControl.getPosition()
      }));
    } catch (err) {
      ws.send(JSON.stringify({
        status: "error",
        message: err.message
      }));
    }
  });
  
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(8080, () => {
  console.log("Socket server listening on :8080");
});