import { Router } from "express";
import {
  getAdminStats,
 getAdminDashboard,
  makeAdmin,
  removeAdmin,
  deleteUser,
} from "../controllers/adminController";

import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { getAllUsers } from "../controllers/authController";

const router = Router();

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getAdminStats
);

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getAdminDashboard
);

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.put(
  "/users/:id/make-admin",
  authMiddleware,
  adminMiddleware,
  makeAdmin
);

router.put(
  "/users/:id/remove-admin",
  authMiddleware,
  adminMiddleware,
  removeAdmin
);

router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  deleteUser
);

export default router;