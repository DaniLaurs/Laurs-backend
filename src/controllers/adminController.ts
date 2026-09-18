import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export const getAdminStats = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await prisma.user.count();
    const stores = await prisma.store.count();
    const products = await prisma.product.count();

    return res.json({
      users,
      stores,
      products,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao buscar estatísticas",
    });
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response
) => {

  try {

    const users = await prisma.user.count();

    const stores = await prisma.store.count();

    const products = await prisma.product.count();

    const period = (req.query.period as string) || "30";

        const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "7":
        startDate.setDate(now.getDate() - 7);
        break;

      case "30":
        startDate.setDate(now.getDate() - 30);
        break;

      case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;

      default:
        startDate.setDate(now.getDate() - 30);
    }

    const previousUsers = await prisma.user.count({
  where: {
    createdAt: {
      lt: startDate,
    },
  },
});

const previousStores = await prisma.store.count({
  where: {
    createdAt: {
      lt: startDate,
    },
  },
});

const previousProducts = await prisma.product.count({
  where: {
    createdAt: {
      lt: startDate,
    },
  },
});

    const userGrowth = await prisma.user.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    const storeGrowth = await prisma.store.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });


    const productGrowth = await prisma.product.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    const growthMap = new Map();


        userGrowth.forEach(item => {
          const date = item.createdAt.toISOString().split("T")[0];

          growthMap.set(date, {
            date,
            users:item._count.id,
            stores:0,
            products:0,
          });
        });


        storeGrowth.forEach(item => {
          const date = item.createdAt.toISOString().split("T")[0];

          if(!growthMap.has(date)){
            growthMap.set(date,{
              date,
              users:0,
              stores:item._count.id,
              products:0,
            });
          }else{
            growthMap.get(date).stores = item._count.id;
          }
        });


        productGrowth.forEach(item => {
          const date = item.createdAt.toISOString().split("T")[0];

          if(!growthMap.has(date)){
            growthMap.set(date,{
              date,
              users:0,
              stores:0,
              products:item._count.id,
            });
          }else{
            growthMap.get(date).products = item._count.id;
          }
        });


       const growth = [];

      const currentDate = new Date(startDate);

      while (currentDate <= now) {
        const date = currentDate.toISOString().split("T")[0];

        if (growthMap.has(date)) {
          growth.push(growthMap.get(date));
        } else {
          growth.push({
            date,
            users: 0,
            stores: 0,
            products: 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
              const newUsers = users - previousUsers;
      const newStores = stores - previousStores;
      const newProducts = products - previousProducts;

      const indicators = {
        users:
          previousUsers === 0
            ? 100
            : Math.round((newUsers / previousUsers) * 100),

        stores:
          previousStores === 0
            ? 100
            : Math.round((newStores / previousStores) * 100),

        products:
          previousProducts === 0
            ? 100
            : Math.round((newProducts / previousProducts) * 100),
      };


    return res.json({

      stats:{
        users,
        stores,
        products
      },


       growth,

      indicators,


 

    });


  } catch(error){

    console.log(error);

    return res.status(500).json({
      error:"Erro ao carregar dashboard"
    });

  }

};


export const makeAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;


    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        role: "ADMIN",
      },
    });

    return res.json(user);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao tornar admin",
    });
  }
};

export const removeAdmin = async (
  req: Request,
  res: Response
) => {
  try {
  const id = req.params.id as string;


    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        role: "USER",
      },
    });

    return res.json(user);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao remover admin",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
) => {
  try {
  const id = req.params.id as string;


    await prisma.user.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Usuário removido",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Erro ao excluir usuário",
    });
  }
};
