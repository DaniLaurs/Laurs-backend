import { Router } from "express";
import { login, register } from "../controllers/authController";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { deleteUser, makeAdmin, removeAdmin } from "../adminController";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get(
  "/admin-test",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    return res.json({
      message: "Você é administrador 🚀",
    });
  }
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