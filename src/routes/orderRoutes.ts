import { Router } from "express";

import {
  createOrder,
  getOrders,
  getSellerDashboard,
  getOrderById,
  updateOrderStatus,
  cancelOrder,

} from "../controllers/orderController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  createOrder
);

router.get(
  "/",
  authMiddleware,
  getOrders
);

router.get(
  "/seller-dashboard",
  authMiddleware,
  getSellerDashboard
);

router.get(
  "/:id",
  authMiddleware,
  getOrderById
);

router.put(
  "/:id/status",
  authMiddleware,
  updateOrderStatus
);

router.put(
   "/:id/cancel", 
  authMiddleware,
   cancelOrder );

export default router;