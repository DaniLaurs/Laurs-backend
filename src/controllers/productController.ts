import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import cloudinary from "../config/cloudinary";

// =======================
// HELPERS
// =======================
const getParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

// =======================)
// CREATE PRODUCT
// =======================
export const createProduct = async (req: Request, res: Response) => {
  try {

    console.log("BODY COMPLETO:", req.body);
console.log("VARIANTS RAW:", req.body.variants);

    const { name, description, price, category,subcategory, variants } = req.body;

    console.log("REQ.BODY:", req.body);
console.log("VARIANTS:", variants);

    const userId = (req as any).userId;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        subcategory,
        price: Number(price),
        store: {
          connect: { id: store.id },
        },
      },
    });

    // =======================
    // VARIANTS (CREATE)
if (variants) {
  const parsed =
    typeof variants === "string"
      ? JSON.parse(variants)
      : variants;

  for (const group of parsed) {
    for (const sizeItem of group.sizes) {
      await prisma.productVariant.create({
        data: {
          color: group.color,
          size: sizeItem.size,
          stock: Number(sizeItem.stock ?? 0),
          productId: product.id,
        },
      });
    }
  }
}

    // =======================
    // IMAGES
    // =======================
const files = req.files ? (req.files as Express.Multer.File[]) : [];
console.log("TOTAL DE IMAGENS RECEBIDAS:", files.length);
console.log("ARQUIVOS:", files.map(file => file.originalname));

    if (files?.length) {
      for (const file of files) {

        console.log(
  "CONFIG CLOUD:",
  process.env.CLOUDINARY_CLOUD_NAME
);
        const uploadedImage = await cloudinary.uploader.upload(file.path);

        await prisma.productImage.create({
          data: {
            imageUrl: uploadedImage.secure_url,
            productId: product.id,
          },
        });
      }
    }

    const productWithImages = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        variants: true,
      },
    });

    console.log(productWithImages);

    return res.status(201).json(productWithImages);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao criar produto" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
  
    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      variants,
      removedImages,
    } = req.body;

    console.log("REQ.BODY:", req.body);
    console.log("VARIANTS:", variants);

    const userId = (req as any).userId;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // =======================
    // REMOVE IMAGES (🗑️ NOVO)
    // =======================
    if (removedImages) {
      const parsed = JSON.parse(removedImages);

      await prisma.productImage.deleteMany({
        where: {
          id: { in: parsed },
        },
      });
    }

    // =======================
    // UPDATE PRODUCT BASIC DATA
    // =======================
    await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: Number(price),
        category,
      
      },
    });

    // =======================
    // VARIANTS (RECREATE)
    // =======================
    if (variants) {
      const parsed =
        typeof variants === "string"
          ? JSON.parse(variants)
          : variants;

      console.log("PARSED:", parsed);

      // remove antigas
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      // recria
      for (const group of parsed || []) {
        for (const sizeItem of group.sizes || []) {
          await prisma.productVariant.create({
            data: {
              color: group.color,
              size: sizeItem.size,
              stock: Number(sizeItem.stock ?? 0),
              productId: id,
            },
          });
        }
      
    }
  }

    // =======================
    // ADD NEW IMAGES (📸 NOVO)
    // =======================
     const files = req.files ? (req.files as Express.Multer.File[]) : [];
     console.log("TOTAL DE IMAGENS RECEBIDAS:", files.length);
console.log("ARQUIVOS:", files.map(file => file.originalname));

    if (files.length > 0) {
      for (const file of files) {
        const uploadedImage = await cloudinary.uploader.upload(file.path);

        await prisma.productImage.create({
          data: {
            imageUrl: uploadedImage.secure_url,
            productId: id,
          },
        });
      }
    }

    // =======================
    // RETURN UPDATED PRODUCT
    // =======================
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
      },
    });

    return res.json(updatedProduct);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};
// =======================
// DELETE PRODUCT
// =======================
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const userId = (req as any).userId;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.json({ message: "Produto deletado com sucesso" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao deletar produto" });
  }
};

// =======================
// GET PRODUCTS
// =======================
export const getProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const {
  search,
  category,
  subcategory,
} = req.query;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const filters: any = {
          storeId: store.id,
        };

        if (search) {
          filters.OR = [
            {
              name: {
                contains: String(search),
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: String(search),
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: String(search),
                mode: "insensitive",
              },
            },
            {
              subcategory: {
                contains: String(search),
                mode: "insensitive",
              },
            },
          ];
        }

        if (category) {
          filters.category = String(category);
        }

        if (subcategory) {
          filters.subcategory = String(subcategory);
        }

    const products = await prisma.product.findMany({
       where: filters,
      include: {
        images: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

export const getPublicProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const { search } = req.query;

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                category: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                subcategory: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,

      include: {
        images: true,
        variants: true,
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

// =======================
// ADD IMAGE
// =======================
export const addProductImage = async (req: Request, res: Response) => {
  try {
    const productId = getParam(req.params.productId);
    const { imageUrl } = req.body;

    if (!productId || !imageUrl) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const image = await prisma.productImage.create({
      data: {
        imageUrl,
        productId,
      },
    });

    return res.json(image);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// =======================
// ADD VARIANT (SINGLE)
// =======================
export const addProductVariant = async (req: Request, res: Response) => {
  try {
    const productId = getParam(req.params.productId);
    const { color, size, stock } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const variant = await prisma.productVariant.create({
      data: {
        color,
        size,
        stock,
        productId,
      },
    });

    return res.status(201).json(variant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao adicionar variante" });
  }
};

// =======================
// GET BY ID
// =======================
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = getParam(req.params.id);

    if (!productId) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        variants: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    return res.json(product);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao buscar produto" });
  }
}
