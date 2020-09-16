import { setupGraphQL } from '@src/api/server-setup';
import { setupTypeORM } from '@src/data/database-setup';

Promise.all([setupGraphQL(), setupTypeORM()]);
