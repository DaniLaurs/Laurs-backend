import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export const createStore = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, description } = req.body;

    const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-");

    const userId = (req as any).userId;

    const storeExists = await prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
    });

    if (storeExists) {
      return res.status(400).json({
        error: "Usuário já possui uma loja",
      });
    }

    const store = await prisma.store.create({
      data: {
        name,
        slug,
        description,
        ownerId: userId,
      },
    });

    return res.status(201).json(store);
  } catch (error) {
  console.log(error);

  return res.status(500).json({
    error: "Erro ao criar loja",
  });
}
};

export const getStoreBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const store = await prisma.store.findUnique({
      where: {
        slug,
      },

      include: {
        products: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    return res.json(store);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao buscar loja",
    });
  }
};

export const updateStoreSlug = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;

    const store = await prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    const slug = store.name
      .toLowerCase()
      .replace(/\s+/g, "-");

    const updatedStore = await prisma.store.update({
      where: {
        id: store.id,
      },

      data: {
        slug,
      },
    });

    return res.json(updatedStore);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao atualizar slug",
    });
  }
};