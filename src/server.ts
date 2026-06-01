import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import storeRoutes from "./routes/storeRoutes";
import productRoutes from "./routes/productRoutes";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/stores", storeRoutes);
app.use("/products", productRoutes);


app.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    message: "Rota protegida",
    userId: (req as any).userId,
  });
});


app.get("/", (req, res) => {
  res.send("API Laurs funcionando 🚀");
});


const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});