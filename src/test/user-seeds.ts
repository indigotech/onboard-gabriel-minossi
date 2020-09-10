import { User } from '@src/entity/User';
import { setupTypeORM } from '@src/server-setup';
import * as faker from 'faker';
import { getConnection, getRepository } from 'typeorm';
import { encrypt } from './helpers';

setupTypeORM().then(() => {
  const users: Partial<User>[] = [];

  for (let nUsers = 0; nUsers < 50; nUsers++) {
    const name = faker.name.firstName();
    const unencryptedPassword = faker.random.alphaNumeric(7);
    const encryptedPassword = encrypt(unencryptedPassword);
    users.push({
      name,
      email: `${name}@domain.com`,
      password: encryptedPassword,
      birthDate: `${faker.date.past()}`,
      cpf: faker.random.number(2147483648), // TODO: Change cpf to string
    });
  }
  getRepository(User).save(users).then(() => getConnection().close());
});
