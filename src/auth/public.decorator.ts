import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca uma rota como publica (o Guard global nao exige token nela).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
