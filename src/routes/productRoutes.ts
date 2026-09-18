import { Router } from "express";

import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  addProductImage,
  addProductVariant,
  getProductById,
  getPublicProducts
} from "../controllers/productController";

import { authMiddleware } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.array("images", 10),
  createProduct
);

router.get("/", authMiddleware, getProducts);

router.post("/:productId/images", addProductImage);

router.post("/:productId/variants", addProductVariant);

router.get("/search", getPublicProducts);

router.get("/:id", getProductById);


router.put(
  "/:id",
  authMiddleware,
  upload.array("images", 10), // 🔥 ESSENCIAL
  updateProduct
);

router.delete("/:id", authMiddleware, deleteProduct);

export default router;