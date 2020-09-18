import * as dotenv from 'dotenv';
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: `${process.cwd()}/.env.test` });
} else {
  dotenv.config({ path: `${process.cwd()}/.env` });
}

import { setupGraphQL } from '@src/api/server-setup';
import { setupTypeORM } from '@src/data/database-setup';

if (process.argv[1].indexOf('mocha') > 0) {
  require('@src/test/index');
} else {
  Promise.all([setupGraphQL(), setupTypeORM()]);
}
