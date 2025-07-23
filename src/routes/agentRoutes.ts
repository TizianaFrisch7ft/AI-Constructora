import express from "express";
import { handleAsk } from "../controllers/agentControllers";

const router = express.Router();

// POST /ask → pregunta en lenguaje natural
router.post("/", handleAsk);

export default router;
