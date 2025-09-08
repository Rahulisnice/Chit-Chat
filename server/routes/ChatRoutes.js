import express from "express";
import {
  createChats,
  deleteChats,
  getChats,
} from "../controllers/chatController.js";
import { protect } from "../middlewares/auth.js";

const chatRouter = express.Router();

chatRouter.get("/create", protect, createChats);
chatRouter.get("/get", protect, getChats);
chatRouter.post("/delete", protect, deleteChats);

export default chatRouter;
