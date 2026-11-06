
import { Router } from "express";
import {
  connectMercadoPago,
  mercadoPagoCallback,
} from "../controllers/paymentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/connect", authMiddleware, connectMercadoPago);
router.get("/callback", mercadoPagoCallback);

export default router;
