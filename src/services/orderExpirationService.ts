
import { prisma } from "../prisma/client";

export async function cancelExpiredOrders() {
  try {
    const now = new Date();

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lte: now,
        },
      },
      include: {
        items: true,
      },
    });

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // Confirma novamente o status para evitar cancelamento duplicado.
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING",
            expiresAt: {
              lte: new Date(),
            },
          },
          data: {
            status: "CANCELLED",
          },
        });

        // Se outro processo já cancelou ou atualizou o pedido,
        // não devolve o estoque novamente.
        if (updated.count === 0) return;

        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: {
                id: item.variantId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          } else {
            await tx.product.update({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      });

      console.log(`Pedido ${order.id} expirado e cancelado.`);
    }
  } catch (error) {
    console.error("Erro ao cancelar pedidos expirados:", error);
  }
}
