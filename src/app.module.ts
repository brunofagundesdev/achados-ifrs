import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { LocalizacoesModule } from './localizacoes/localizacoes.module.js';
import { ObjetosModule } from './objetos/objetos.module.js';
import { PerfisModule } from './perfis/perfis.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RelatoriosModule } from './relatorios/relatorios.module.js';
import { RetiradasModule } from './retiradas/retiradas.module.js';
import { TagsModule } from './tags/tags.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    PerfisModule,
    CategoriasModule,
    TagsModule,
    LocalizacoesModule,
    ObjetosModule,
    RetiradasModule,
    RelatoriosModule,
  ],
})
export class AppModule {}
