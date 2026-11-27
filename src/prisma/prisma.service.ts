import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaNeon(
      {
        connectionString: process.env.DATABASE_URL,
      },
      {
        onPoolError: (error) =>
          this.logger.error(`Erro no pool Neon: ${error.message}`, error.stack),
        onConnectionError: (error) =>
          this.logger.error(
            `Erro na conexão Neon: ${error.message}`,
            error.stack,
          ),
      },
    );
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
