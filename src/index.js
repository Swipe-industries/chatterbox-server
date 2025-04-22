import dotenv from "dotenv";
import {createServer} from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middlewares/errors.js";
import { parseJson } from "./middlewares/jsonParser.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(parseJson); //ignoring the GET req for optimization
app.use(morgan(':method   :url    :status     :response-time ms')); //comment it out or remove when putting code in production

// Routes
app.get("/", (_, res) => {
    res.send({"message": "hello from home route"})
})
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/chats", chatRoutes);
app.use("/messages", messageRoutes);

// Error handling middleware
app.use(errorHandler);

const server = createServer(app);
const PORT = process.env.PORT || 8080;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let activeUsers = [];

io.on("connection",(socket) => {
  //add a new user to socket server
  socket.on('add-new-user', (newUserId) => {
    if(!activeUsers.some((user) => user.userId === newUserId)){
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id
      })
    }
    socket.broadcast.emit('get-users', activeUsers)
  })

  // Handle sending and receiving messages
  socket.on('send-message', (data) => {
    const { receiverId, message } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    if (user) {
      io.to(user.socketId).emit('receive-message', message);
    }
  });

  socket.on('user-typing', ({ userId, receiverId }) => {
    const user = activeUsers.find(u => u.userId === userId);
    if (user) {
      user.isTyping = true;
      io.to(activeUsers.find(u => u.userId === receiverId)?.socketId).emit('user-typing', userId);
    }
  });

  socket.on('user-stop-typing', ({ userId, receiverId }) => {
    const user = activeUsers.find(u => u.userId === userId);
    if (user) {
      user.isTyping = false;
      io.to(activeUsers.find(u => u.userId === receiverId)?.socketId).emit('user-stop-typing', userId);
    }
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id)
    io.emit('get-users', activeUsers) 
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});