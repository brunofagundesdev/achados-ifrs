import { SetMetadata } from '@nestjs/common';
import type { Papel } from '../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

export const Roles = (...papeis: Papel[]) => SetMetadata(ROLES_KEY, papeis);
