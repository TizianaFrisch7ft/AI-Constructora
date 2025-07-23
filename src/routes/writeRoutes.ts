import { Router } from "express";
import { handleWrite } from "../controllers/writeController";
const router = Router();

router.post("/", handleWrite); // POST /write
export default router;
