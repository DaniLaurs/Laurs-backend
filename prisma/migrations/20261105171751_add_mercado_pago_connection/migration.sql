-- CreateTable
CREATE TABLE "MercadoPagoConnection" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "mpUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercadoPagoConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoPagoOAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercadoPagoOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPagoConnection_storeId_key" ON "MercadoPagoConnection"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPagoOAuthState_state_key" ON "MercadoPagoOAuthState"("state");

-- AddForeignKey
ALTER TABLE "MercadoPagoConnection" ADD CONSTRAINT "MercadoPagoConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MercadoPagoOAuthState" ADD CONSTRAINT "MercadoPagoOAuthState_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
