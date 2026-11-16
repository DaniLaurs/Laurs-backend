import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import storeRoutes from "./routes/storeRoutes";
import productRoutes from "./routes/productRoutes";
import adminRoutes from "./routes/admin.routes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import { cancelExpiredOrders } from "./services/orderExpirationService";


dotenv.config();


const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "https://laurs-frontend-ui7k.vercel.app",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite chamadas sem origem, como algumas requisições servidor-servidor.
      if (!origin) {
        return callback(null, true);
      }

      // Domínios de produção e preview do projeto Laurs na Vercel.
      const isLaursVercel =
        /^https:\/\/laurs-frontend-[a-z0-9-]+\.vercel\.app$/i.test(origin);

      const isAllowed = allowedOrigins.includes(origin) || isLaursVercel;

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error("Origem não permitida pelo CORS"));
    },
  })
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/stores", storeRoutes);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);


app.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    message: "Rota protegida",
    userId: (req as any).userId,
  });
});


app.get("/", (req, res) => {
  res.send("API Laurs funcionando 🚀");
});

app.get("/teste", (req, res) => {
  return res.json({
    mensagem: "teste backend dani",
  });
});


app.get("/teste-orders", (req, res) => {
  console.log("🔥 TESTE ORDERS FOI CHAMADO 🔥");

  return res.json({
    message: "Rota teste orders funcionando",
  });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

  // Verifica pedidos expirados a cada 1 minuto.
  cancelExpiredOrders();

  setInterval(() => {
    cancelExpiredOrders();
  }, 60 * 1000);
});