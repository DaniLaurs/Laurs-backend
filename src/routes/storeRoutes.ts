import { Router } from "express";

import { createStore, getStoreBySlug, updateStoreSlug } from "../controllers/storeController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, createStore);

router.get("/:slug", getStoreBySlug);

router.put("/slug", authMiddleware, updateStoreSlug);   

export default router;