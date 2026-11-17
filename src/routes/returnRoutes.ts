
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";

import { createReturnRequest } from "../controllers/returnController";
import { authMiddleware } from "../middleware/authMiddleware";
import returnUpload from "../middleware/returnUpload";

const router = Router();

router.post(
  "/",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    returnUpload.array("images", 10)(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Cada imagem pode ter no máximo 5 MB",
          });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            error: "Você pode enviar no máximo 10 imagens",
          });
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            error: "Campo de imagem inválido ou limite de 10 imagens excedido",
          });
        }

        return res.status(400).json({
          error: "Erro ao enviar as imagens",
        });
      }

    if (error instanceof Error && error.message === "FORMATO_IMAGEM_INVALIDO") {
    return res.status(400).json({
        error: "Formato inválido. Envie imagens JPG, PNG ou WebP.",
    });
    }

    if (error) {
    return next(error);
    }

      next();
    });
  },
  createReturnRequest
);

export default router;
