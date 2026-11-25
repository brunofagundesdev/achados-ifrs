-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('USUARIO', 'RESPONSAVEL', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "StatusObjeto" AS ENUM ('PERDIDO', 'ENCONTRADO', 'DEVOLVIDO');

-- CreateEnum
CREATE TYPE "TipoLocalizacao" AS ENUM ('CAMPUS', 'PREDIO', 'ANDAR', 'SALA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'USUARIO',

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis" (
    "id" SERIAL NOT NULL,
    "telefone" TEXT,
    "matricula" TEXT,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localizacoes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoLocalizacao" NOT NULL,
    "paiId" INTEGER,

    CONSTRAINT "localizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetos" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataOcorrencia" TIMESTAMP(3) NOT NULL,
    "contato" TEXT,
    "status" "StatusObjeto" NOT NULL,
    "sensivel" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoriaId" INTEGER NOT NULL,
    "localizacaoId" INTEGER NOT NULL,
    "registradoPorId" INTEGER NOT NULL,

    CONSTRAINT "objetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "objetoId" INTEGER NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiradas" (
    "id" SERIAL NOT NULL,
    "retiradoPorNome" TEXT NOT NULL,
    "retiradoPorDocumento" TEXT,
    "dataRetirada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objetoId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,

    CONSTRAINT "retiradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ObjetoToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ObjetoToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_usuarioId_key" ON "perfis"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nome_key" ON "tags"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "retiradas_objetoId_key" ON "retiradas"("objetoId");

-- CreateIndex
CREATE INDEX "_ObjetoToTag_B_index" ON "_ObjetoToTag"("B");

-- AddForeignKey
ALTER TABLE "perfis" ADD CONSTRAINT "perfis_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localizacoes" ADD CONSTRAINT "localizacoes_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "localizacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetos" ADD CONSTRAINT "objetos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetos" ADD CONSTRAINT "objetos_localizacaoId_fkey" FOREIGN KEY ("localizacaoId") REFERENCES "localizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetos" ADD CONSTRAINT "objetos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_objetoId_fkey" FOREIGN KEY ("objetoId") REFERENCES "objetos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_objetoId_fkey" FOREIGN KEY ("objetoId") REFERENCES "objetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjetoToTag" ADD CONSTRAINT "_ObjetoToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "objetos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjetoToTag" ADD CONSTRAINT "_ObjetoToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
