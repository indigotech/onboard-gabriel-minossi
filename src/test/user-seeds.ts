import { setupTypeORM } from '@src/data/database-setup';
import { User } from '@src/data/entity/User';
import { encrypt } from '@src/helpers';
import * as faker from 'faker';
import { getConnection, getRepository } from 'typeorm';

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
      cpf: faker.random.number(99999999999).toString(),
    });
  }
  getRepository(User)
    .save(users)
    .then(() => getConnection().close());
});
