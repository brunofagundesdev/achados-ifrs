import { SetMetadata } from '@nestjs/common';
import type { Papel } from '../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

// Restringe a rota (ou o controller inteiro) a certos papeis.
// Ex.: @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
export const Roles = (...papeis: Papel[]) => SetMetadata(ROLES_KEY, papeis);
