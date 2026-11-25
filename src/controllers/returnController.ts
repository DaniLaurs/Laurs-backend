
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

      // Verifica o prazo de 7 dias após a conclusão.
    if (order.status === "COMPLETED") {
      if (!order.completedAt) {
        return res.status(400).json({
          error: "Data de conclusão do pedido não encontrada",
        });
      }

      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      const deadline =
        order.completedAt.getTime() + sevenDaysInMs;

      if (Date.now() > deadline) {
        return res.status(400).json({
          error: "O prazo de 7 dias para solicitar troca ou devolução expirou",
        });
      }
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


            // Verifica novamente o prazo de 7 dias.
    if (currentOrder.status === "COMPLETED") {
      if (!currentOrder.completedAt) {
        throw new Error("DATA_CONCLUSAO_NAO_ENCONTRADA");
      }

      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      const deadline =
        currentOrder.completedAt.getTime() + sevenDaysInMs;

      if (Date.now() > deadline) {
        throw new Error("PRAZO_DEVOLUCAO_EXPIRADO");
      }
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

        if (error.message === "DATA_CONCLUSAO_NAO_ENCONTRADA") {
      return res.status(400).json({
        error: "Data de conclusão do pedido não encontrada",
      });
    }

    if (error.message === "PRAZO_DEVOLUCAO_EXPIRADO") {
      return res.status(400).json({
        error: "O prazo de 7 dias para solicitar troca ou devolução expirou",
      });
    }

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



// =======================
// GET SELLER RETURN REQUESTS
// =======================

export const getSellerReturnRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    console.log("USER ID:", userId);

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const store = await prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
    });

    console.log("LOJA ENCONTRADA:", store);

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    const returnRequests = await prisma.returnRequest.findMany({
      where: {
        order: {
          storeId: store.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          include: {
            store: true,
          },
        },
        items: {
          include: {
            images: true,
            orderItem: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(returnRequests);

  } catch (error) {
    console.error(
      "ERRO AO BUSCAR DEVOLUÇÕES DO VENDEDOR:",
      error
    );

    return res.status(500).json({
      error: "Erro ao buscar solicitações de devolução",
    });
  }
};



export const decideReturnRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    const returnId = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;

    const { status, sellerResponse } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // =======================
    // VALIDAR DECISÃO
    // =======================

    if (
      !["RETURN_APPROVED", "RETURN_REJECTED"].includes(status)
    ) {
      return res.status(400).json({
        error: "Decisão inválida",
      });
    }

    const responseText =
      typeof sellerResponse === "string"
        ? sellerResponse.trim()
        : "";

    if (status === "RETURN_REJECTED" && !responseText) {
      return res.status(400).json({
        error: "Informe o motivo da rejeição",
      });
    }

    // =======================
    // VERIFICAR SE A DEVOLUÇÃO
    // PERTENCE À LOJA
    // =======================

    const returnRequest = await prisma.returnRequest.findFirst({
      where: {
        id: returnId,
        order: {
          store: {
            ownerId: userId,
          },
        },
      },
    });

    if (!returnRequest) {
      return res.status(404).json({
        error: "Solicitação não encontrada",
      });
    }

    // =======================
    // VERIFICAR STATUS
    // =======================

    if (returnRequest.status !== "PENDING") {
      return res.status(400).json({
        error: "Esta solicitação já foi decidida",
      });
    }

    // =======================
    // ATUALIZAR DECISÃO
    // =======================

    const updated = await prisma.returnRequest.updateMany({
      where: {
        id: returnId,
        status: "PENDING",
      },
      data: {
        status,
        sellerResponse: responseText || null,
      },
    });

    // Evita decisões simultâneas.
    if (updated.count === 0) {
      return res.status(409).json({
        error: "Esta solicitação já foi decidida",
      });
    }

    const updatedRequest = await prisma.returnRequest.findUnique({
      where: {
        id: returnId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            images: true,
            orderItem: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      message:
        status === "RETURN_APPROVED"
          ? "Devolução aprovada com sucesso"
          : "Devolução rejeitada com sucesso",
      returnRequest: updatedRequest,
    });
  } catch (error) {
    console.error("ERRO AO DECIDIR DEVOLUÇÃO:", error);

    return res.status(500).json({
      error: "Erro ao atualizar decisão da devolução",
    });
  }
};


