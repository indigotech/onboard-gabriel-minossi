import { HttpError } from '@src/error';
import * as dotenv from 'dotenv';
import { createConnection } from 'typeorm';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: `${process.cwd()}/.env.test` });
} else {
  dotenv.config({ path: `${process.cwd()}/.env` });
}

export const setupTypeORM = async () => {
  try {
    await createConnection();
  } catch (error) {
    throw new HttpError(503, 'Are you sure the Docker database container is up?', error);
  }
};
