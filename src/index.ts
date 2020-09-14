import { setupGraphQL, setupTypeORM } from '@src/server-setup';

Promise.all([setupGraphQL(), setupTypeORM()]);
