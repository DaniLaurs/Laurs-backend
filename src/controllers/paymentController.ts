
import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { randomBytes } from "crypto";
import { encryptToken } from "../utils/encryption";


export const connectMercadoPago = async (
  req: Request,
  res: Response
) => {
  try {

        const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = process.env.MP_REDIRECT_URI;

    if (!clientId || !redirectUri) {
    return res.status(500).json({
        message: "Credenciais do Mercado Pago não configuradas.",
    });
    }

    const userId = (req as any).userId;

const store = await prisma.store.findUnique({
  where: { ownerId: userId },
});

if (!store) {
  return res.status(404).json({
    message: "Você precisa ter uma loja cadastrada para conectar o Mercado Pago.",
  });
}

const state = randomBytes(32).toString("hex");

await prisma.mercadoPagoOAuthState.create({
  data: {
    state,
    storeId: store.id,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  },
});
 

    const authUrl = new URL(
      "https://auth.mercadopago.com.br/authorization"
    );

    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("platform_id", "mp");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    


    return res.redirect(authUrl.toString());

  } catch (error) {
    console.error("Erro ao conectar Mercado Pago:", error);

    return res.status(500).json({
      message: "Erro ao iniciar conexão com Mercado Pago.",
    });
  }
};


export const mercadoPagoCallback = async (
  req: Request,
  res: Response
) => {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        message: "Código de autorização não recebido.",
      });
    }

    if (!state || typeof state !== "string") {
      return res.status(400).json({
        message: "State não recebido ou inválido.",
      });
    }

    const oauthState = await prisma.mercadoPagoOAuthState.findUnique({
    where: { state },
    });

    if (!oauthState) {
    return res.status(400).json({
        message: "Tentativa de autorização não encontrada.",
    });
    }

    const consumedState = await prisma.mercadoPagoOAuthState.deleteMany({
    where: {
        id: oauthState.id,
        expiresAt: {
        gt: new Date(),
       },
    },
    }); 

    if (consumedState.count !== 1) {
    return res.status(400).json({
        message: "State expirado ou já utilizado. Tente novamente.",
    });
    }

    const clientId = process.env.MP_CLIENT_ID;
    const clientSecret = process.env.MP_CLIENT_SECRET;
    const redirectUri = process.env.MP_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({
        message: "Credenciais do Mercado Pago não configuradas.",
    });
}
    
        const tokenResponse = await fetch(
      "https://api.mercadopago.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "Erro na troca OAuth. Status:",
        tokenResponse.status
      );
    
      return res.status(400).json({
        message: "Não foi possível conectar a conta do Mercado Pago.",
      });
    }

    if (
      !tokenData.access_token ||
      !tokenData.refresh_token ||
      !tokenData.user_id ||
      !tokenData.expires_in ||
      !tokenData.public_key
    ) {
      return res.status(400).json({
        message: "Resposta inválida recebida do Mercado Pago.",
      });
    }

    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = encryptToken(tokenData.refresh_token);

    const expiresAt = new Date(
      Date.now() + Number(tokenData.expires_in) * 1000
    );

    await prisma.mercadoPagoConnection.upsert({
      where: {
        storeId: oauthState.storeId,
      },
      update: {
        mpUserId: String(tokenData.user_id),
        publicKey: String(tokenData.public_key),
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      },
      create: {
        storeId: oauthState.storeId,
        mpUserId: String(tokenData.user_id),
        publicKey: String(tokenData.public_key),
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      },
    });

    return res.status(200).json({
      message: "Conta do Mercado Pago conectada com sucesso!",
    });

      } catch (error) {
    console.error("Erro no callback Mercado Pago:", error);

    return res.status(500).json({
      message: "Erro ao processar autorização.",
    });
  }
};