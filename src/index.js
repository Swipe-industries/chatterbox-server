import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middlewares/errors.js";
import initSocket from "./socket/index.js";

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())
app.use(morgan(":method   :url    :status     :response-time ms"));

// Routes
app.get("/", (_, res) => res.send({ message: "hello from home route" }));
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", chatRoutes);
app.use("/api", messageRoutes);

// Error handling middleware
app.use(errorHandler);

//creating server using http module (socket.io demands it)
const httpServer = createServer(app);
const PORT = process.env.PORT || 8080;

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
