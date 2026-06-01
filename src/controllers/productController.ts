import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import cloudinary from "../config/cloudinary";

export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, description, price } = req.body;

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

    let imageUrl = "";

    if (req.file) {
      const uploadedImage =
        await cloudinary.uploader.upload(
          req.file.path
        );

      imageUrl = uploadedImage.secure_url;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        imageUrl,
        storeId: store.id,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao criar produto",
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      imageUrl,
    } = req.body;

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

    const product = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado",
      });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        price,
        imageUrl,
      },
    });

    return res.json(updatedProduct);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao atualizar produto",
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

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

    const product = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado",
      });
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Produto deletado com sucesso",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao deletar produto",
    });
  }
};

export const getProducts = async (
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

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(products);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao buscar produtos",
    });
  }
};