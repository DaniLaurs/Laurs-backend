
import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import cloudinary from "../config/cloudinary";

export const createStore = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, description, segment, logo, banner, } = req.body;

   
      const slugGenerated = name
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
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
        slug: slugGenerated,
        description,
        segment,
        logo,
        banner,
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

export const getStoreBySlug = async (req: Request, res: Response) => {
  try {
   
    const slug = Array.isArray(req.params.slug)
  ? req.params.slug[0]
  : req.params.slug;

    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            images: true,
            variants: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    return res.json(store);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao buscar loja" });
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

export const getMyStore = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;

    const store = await prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
      include: {
        products: {
          include: {
            images: true,
            variants: true,
          },
        },
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

export const updateStore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { name, description,  segment, logo, banner } = req.body;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        name: name ?? store.name,
        description: description ?? store.description,
        segment: segment ?? store.segment,
        logo: logo ?? store.logo,
        banner: banner ?? store.banner,
        slug: name?.toLowerCase().replace(/\s+/g, "-") ?? store.slug,
      },
    });

    return res.json(updatedStore);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao atualizar loja" });
  }
};