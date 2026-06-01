import { Router } from "express";

import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from "../controllers/productController";

import { authMiddleware } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createProduct
);

router.get("/", authMiddleware, getProducts);

router.put("/:id", authMiddleware, updateProduct);

router.delete("/:id", authMiddleware, deleteProduct);

export default router;