export { prisma } from './client.js';
/** Named export avoids Turbopack `export *` warnings with external CJS @prisma/client. */
export { Prisma } from '@prisma/client';
