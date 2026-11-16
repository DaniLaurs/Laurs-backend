
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { unlink } from "fs/promises";

import { prisma } from "../prisma/client";
import cloudinary from "../config/cloudinary";

// =======================
// CREATE RETURN REQUEST
// =======================

export const createReturnRequest = async (
  req: Request,
  res: Response
) => {
  const files = req.files
    ? (req.files as Express.Multer.File[])
    : [];

  const uploadedImages: {
    secure_url: string;
    public_id: string;
    itemIndex: number;
  }[] = [];

  let requestCreated = false;

  try {
    const userId = (req as any).userId;

    const { orderId, reason, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!orderId || !reason || !description) {
      return res.status(400).json({
        error: "Preencha todos os campos obrigatórios",
      });
    }

    // =======================
    // PARSE DOS ITENS
    // =======================

    let items;

    try {
      items =
        typeof req.body.items === "string"
          ? JSON.parse(req.body.items)
          : req.body.items;
    } catch {
      return res.status(400).json({
        error: "Formato dos produtos inválido",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Informe pelo menos um produto para devolução",
      });
    }

    // Verifica se todos os itens possuem os dados necessários.
    for (const item of items) {
    if (
        !item ||
        typeof item !== "object" ||
        typeof item.orderItemId !== "string" ||
        !item.orderItemId.trim() ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    ) {
        return res.status(400).json({
        error: "Produto ou quantidade inválida",
        });
    }
    }

    // Impede repetir o mesmo produto na solicitação.
    const uniqueIds = new Set(
    items.map((item: any) => item.orderItemId)
    );

    if (uniqueIds.size !== items.length) {
    return res.status(400).json({
        error: "Não repita o mesmo produto na solicitação",
    });
    }

    // =======================
    // RELACIONAR FOTOS AOS ITENS
    // =======================

    let imageItemIndexes: number[] = [];

        if (req.body.imageItemIndexes) {
        try {
        const parsedIndexes =
    typeof req.body.imageItemIndexes === "string"
        ? JSON.parse(req.body.imageItemIndexes)
        : req.body.imageItemIndexes;

    if (!Array.isArray(parsedIndexes)) {
    return res.status(400).json({
        error: "Relacionamento das fotos inválido",
    });
    }

    const imagesPerItem = new Map<number, number>();

        for (const index of imageItemIndexes) {
        const total = (imagesPerItem.get(index) || 0) + 1;

        imagesPerItem.set(index, total);

        if (total > 5) {
            return res.status(400).json({
            error: "Você pode enviar no máximo 5 fotos por produto",
            });
        }
        }

    imageItemIndexes = parsedIndexes;
      } catch {
        return res.status(400).json({
          error: "Relacionamento das fotos inválido",
        });
      }
    } else if (files.length > 0 && items.length === 1) {
      imageItemIndexes = files.map(() => 0);
    } else if (files.length > 0) {
      return res.status(400).json({
        error: "Informe a qual produto cada foto pertence",
      });
    }

    if (
      !Array.isArray(imageItemIndexes) ||
      imageItemIndexes.length !== files.length ||
      imageItemIndexes.some(
        (index) =>
          !Number.isInteger(index) ||
          index < 0 ||
          index >= items.length
      )
    ) {
      return res.status(400).json({
        error: "Relacionamento das fotos inválido",
      });
    }

    if (
      files.length > 10 ||
      files.some((file) => !file.mimetype.startsWith("image/"))
    ) {
      return res.status(400).json({
        error: "Envie no máximo 10 arquivos de imagem",
      });
    }

    // =======================
    // VERIFICAR PEDIDO
    // =======================

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Pedido não encontrado",
      });
    }

    if (!["SHIPPED", "COMPLETED"].includes(order.status)) {
      return res.status(400).json({
        error: "Este pedido ainda não está disponível para devolução",
      });
    }

    // =======================
    // UPLOAD DAS FOTOS
    // =======================

    for (let i = 0; i < files.length; i++) {
      const uploaded = await cloudinary.uploader.upload(
        files[i].path,
        {
          folder: "laurs/returns",
          resource_type: "image",
        }
      );

      uploadedImages.push({
        secure_url: uploaded.secure_url,
        public_id: uploaded.public_id,
        itemIndex: imageItemIndexes[i],
      });
    }

    // =======================
    // CRIAR SOLICITAÇÃO
    // =======================

    const returnRequest = await prisma.$transaction(
    async (tx) => {
        // Confere novamente se o pedido continua disponível.
        const currentOrder = await tx.order.findFirst({
        where: {
            id: orderId,
            userId,
            status: {
            in: ["SHIPPED", "COMPLETED"],
            },
        },
        include: {
            items: true,
        },
        });

        if (!currentOrder) {
        throw new Error("PEDIDO_NAO_DISPONIVEL");
        }

        const orderItems = currentOrder.items;

        for (const item of items) {
          const purchasedItem = orderItems.find(
            (orderItem) =>
              orderItem.id === item.orderItemId
          );

          if (!purchasedItem) {
            throw new Error("ITEM_NAO_PERTENCE_AO_PEDIDO");
          }

          const previousReturns = await tx.returnItem.findMany({
            where: {
              orderItemId: item.orderItemId,
              returnRequest: {
                status: {
                  not: "RETURN_REJECTED",
                },
              },
            },
            select: {
              quantity: true,
            },
          });

         const alreadyRequested = previousReturns.reduce(
            (total, previous) => total + previous.quantity,
            0
            );

            const availableQuantity = Math.max(
        0,
        purchasedItem.quantity - alreadyRequested
        );

        if (item.quantity > availableQuantity) {
        throw new Error("QUANTIDADE_INDISPONIVEL");
        }
        }

        return tx.returnRequest.create({
          data: {
            orderId,
            userId,
            reason,
            description,
            status: "PENDING",

            items: {
              create: items.map(
                (item: any, index: number) => ({
                  orderItemId: item.orderItemId,
                  quantity: item.quantity,

                  images: {
                    create: uploadedImages
                      .filter(
                        (image) => image.itemIndex === index
                      )
                      .map((image) => ({
                        imageUrl: image.secure_url,
                      })),
                  },
                })
              ),
            },
          },

          include: {
            items: {
              include: {
                images: true,
                orderItem: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    requestCreated = true;

    return res.status(201).json({
      message: "Solicitação de devolução enviada com sucesso",
      returnRequest,
    });

  } catch (error) {
    console.error("ERRO AO SOLICITAR DEVOLUÇÃO:", error);


  if (error instanceof Error) {

    if (error.message === "PEDIDO_NAO_DISPONIVEL") {
      return res.status(400).json({
        error: "Este pedido não está mais disponível para devolução",
      });
    }

    if (error.message === "ITEM_NAO_PERTENCE_AO_PEDIDO") {
      return res.status(400).json({
        error: "Um dos produtos não pertence a este pedido",
      });
    }

    if (error.message === "QUANTIDADE_INDISPONIVEL") {
      return res.status(400).json({
        error: "A quantidade solicitada ultrapassa o limite disponível para devolução",
      });
    }
  }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return res.status(409).json({
        error: "Houve outra solicitação simultânea. Tente novamente.",
      });
    }

    return res.status(500).json({
      error: "Erro ao criar solicitação de devolução",
    });

  } finally {
    // Remove os arquivos temporários do servidor.
    await Promise.all(
      files.map((file) =>
        unlink(file.path).catch(() => undefined)
      )
    );

    // Se o banco não salvou a solicitação,
    // remove as imagens que já foram enviadas ao Cloudinary.
    if (!requestCreated) {
      await Promise.all(
        uploadedImages.map((image) =>
          cloudinary.uploader.destroy(image.public_id)
            .catch(() => undefined)
        )
      );
    }
  }
};
