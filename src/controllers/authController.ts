import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      return res.status(400).json({
        error: "Usuário já existe",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

   return res.status(201).json({
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  },
});
  } catch (error) {
  console.log(error);

  return res.status(500).json({
    error: "Erro no registro",
  });
}
};
export const login = async (req: Request, res: Response) => {

  console.log("🔥 ENTROU NO LOGIN");
  console.log("🔥 BODY RECEBIDO:", req.body);

  try {
    const { email, password } = req.body;

    console.log("📩 DADOS:", email);

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    console.log("👤 USUÁRIO:", user);

    if (!user) {
      return res.status(400).json({
        error: "Usuário não encontrado",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    console.log("🔑 SENHA OK:", passwordMatch);

    if (!passwordMatch) {
      return res.status(400).json({
        error: "Senha inválida",
      });
    }

    console.log("JWT SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    console.log("🎟️ TOKEN GERADO");

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });

  } catch (error) {
    console.error("❌ ERRO LOGIN:", error);

    return res.status(500).json({
      error: "Erro no login",
    });
  }
};
export const getAllUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json(users);
  } catch (error) {

    return res.status(500).json({
      error: "Erro ao buscar usuários",
    });
  }
};