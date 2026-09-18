import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import storeRoutes from "./routes/storeRoutes";
import productRoutes from "./routes/productRoutes";
import adminRoutes from "./routes/admin.routes";
import orderRoutes from "./routes/orderRoutes";


dotenv.config();

console.log("BANCO:", process.env.DATABASE_URL);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/stores", storeRoutes);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", orderRoutes);


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
    banco: process.env.DATABASE_URL,
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
});