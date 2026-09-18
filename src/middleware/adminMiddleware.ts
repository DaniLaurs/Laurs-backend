import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

     
    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    next();
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro de autenticação",
    });
  }
};