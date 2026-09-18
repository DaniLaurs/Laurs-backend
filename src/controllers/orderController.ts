import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export const createOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Carrinho vazio",
      });
    }
   
    // =======================
    // AGRUPAR ITENS POR LOJA
    // =======================

    const itemsByStore = items.reduce(
      (
        groups: Record<string, any[]>,
        item: any
      ) => {
        if (!groups[item.storeId]) {
          groups[item.storeId] = [];
        }

        groups[item.storeId].push(item);

        return groups;
      },
      {}
    );

    const createdOrders = [];

    // =======================
    // CRIAR UM PEDIDO POR LOJA
    // =======================

    for (const storeId of Object.keys(itemsByStore)) {
      const storeItems = itemsByStore[storeId];

      const store = await prisma.store.findUnique({
        where: {
          id: storeId,
        },
      });

      if (!store) {
        return res.status(404).json({
          error: "Loja não encontrada",
        });
      }

      let total = 0;

      const orderItems = [];

      // =======================
      // VALIDAR PRODUTOS
      // =======================

      for (const item of storeItems) {
        const product = await prisma.product.findUnique({
          where: {
            id: item.id,
          },
          include: {
            variants: true,
          },
        });

        if (!product) {
          return res.status(404).json({
            error: `Produto não encontrado: ${item.id}`,
          });
        }

        // Garante que o produto pertence à loja
        if (product.storeId !== storeId) {
          return res.status(400).json({
            error: "Produto não pertence à loja informada",
          });
        }

        let variant = null;

        if (item.variant?.id) {
          variant = product.variants.find(
            (productVariant) =>
              productVariant.id === item.variant.id
          );

          if (!variant) {
            return res.status(404).json({
              error: "Variante não encontrada",
            });
          }

          if (variant.stock < item.quantity) {
            return res.status(400).json({
              error: `Estoque insuficiente para ${product.name}`,
            });
          }
        }

        const price = product.price;

        total += price * item.quantity;

        orderItems.push({
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity: item.quantity,
          price,
        });
      }

      // =======================
      // CRIAR PEDIDO
      // =======================

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      createdOrders.push(order);
    }

    return res.status(201).json({
      message: "Pedido criado com sucesso",
      orders: createdOrders,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao criar pedido",
    });
  }
};


export const getOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;

    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            variant: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      "🔥 GET ORDERS FOI CHAMADO 🔥",
      JSON.stringify(orders[0]?.items[0]?.product?.images, null, 2)
    );

    return res.json(orders);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao buscar pedidos",
    });
  }
};

export const getSellerDashboard = async (
  req: Request,
  res: Response
) => {
  try {

  
    const userId = (req as any).userId;

    // =======================
    // BUSCAR A LOJA DO VENDEDOR
    // =======================

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

    // =======================
    // BUSCAR PEDIDOS DA LOJA
    // =======================

    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            variant: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // =======================
    // CALCULAR INDICADORES
    // =======================

    const totalOrders = orders.length;

    const totalRevenue = orders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((total, order) => total + order.total, 0);

    const totalProducts = orders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((total, order) => {
        return (
          total +
          order.items.reduce(
            (itemTotal, item) => itemTotal + item.quantity,
            0
          )
        );
      }, 0);

    // =======================
    // PEDIDOS RECENTES
    // =======================

    const recentOrders = orders.slice(0, 5);

    return res.json({
      store,
      stats: {
        totalOrders,
        totalRevenue,
        totalProducts,
      },
      recentOrders,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao buscar dashboard do vendedor",
    });
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    const orderId = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;

    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED", 
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Status inválido",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        store: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Pedido não encontrado",
      });
    }

    if (order.store.ownerId !== userId) {
      return res.status(403).json({
        error: "Você não pode alterar este pedido",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    return res.json(updatedOrder);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao atualizar status do pedido",
    });
  }
};


    // =======================
    // CANCEL ORDER
    // =======================
    export const cancelOrder = async (
    req: Request,
    res: Response
    ) => {
    try {
        const userId = (req as any).userId;

        const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

        if (!id) {
        return res.status(400).json({
            error: "ID do pedido é obrigatório",
        });
        }

        // =======================
        // BUSCAR PEDIDO
        // =======================

        const order = await prisma.order.findUnique({
        where: {
            id,
        },
        });

        if (!order) {
        return res.status(404).json({
            error: "Pedido não encontrado",
        });
        }

        // =======================
        // GARANTIR QUE O PEDIDO É DO USUÁRIO
        // =======================

        if (order.userId !== userId) {
        return res.status(403).json({
            error: "Você não pode cancelar este pedido",
        });
        }

        // =======================
        // VERIFICAR STATUS
        // =======================

        if (order.status !== "PENDING") {
        return res.status(400).json({
            error: "Este pedido não pode mais ser cancelado",
        });
        }

        // =======================
        // CANCELAR PEDIDO
        // =======================

        const cancelledOrder = await prisma.order.update({
        where: {
            id,
        },
        data: {
            status: "CANCELLED",
        },
        });

        return res.json({
        message: "Pedido cancelado com sucesso",
        order: cancelledOrder,
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
        error: "Erro ao cancelar pedido",
        });
    }
    };


    export const getOrderById = async (
req: Request,
res: Response
) => {
try {
const userId = (req as any).userId;
const { id } = req.params as { id: string };


const order = await prisma.order.findFirst({
  where: {
    id,
    store: {
      ownerId: userId,
    },
  },
  include: {
    store: true,

    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },

    items: {
      include: {
        product: {
          include: {
            images: true,
          },
        },

        variant: true,
      },
    },
  },
});

if (!order) {
  return res.status(404).json({
    error: "Pedido não encontrado",
  });
}

return res.json(order);


} catch (error) {
console.log(error);

return res.status(500).json({
  error: "Erro ao buscar pedido",
});


}
};


