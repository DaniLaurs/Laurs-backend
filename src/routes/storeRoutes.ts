import { Router } from "express";

import { createStore, getStoreBySlug, updateStoreSlug,  getMyStore,
  updateStore } from "../controllers/storeController";
  import upload from "../middleware/upload";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, createStore);

router.get("/me", authMiddleware, getMyStore);

router.get("/:slug", getStoreBySlug);

router.put(
  "/",
  authMiddleware,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateStore
);

export default router;