import { HttpError } from '@src/error';
import { Container } from 'typedi';
import { createConnection, useContainer } from 'typeorm';

export const setupTypeORM = async () => {
  try {
    useContainer(Container);
    return createConnection();
  } catch (error) {
    throw new HttpError(503, 'Are you sure the Docker database container is up?', error);
  }
};
