import { GetUsersInput } from '@src/api/graphql/user/get-users.input';
import { User } from '@src/data/entity/User';
import { encrypt } from '@src/helpers';
import { expect } from 'chai';
import * as jwt from 'jsonwebtoken';

const unencryptedPassword = 'Supersafe';
const existingUser: Partial<User> = {
  name: 'existing',
  email: 'existing-email@example.com',
  password: encrypt(unencryptedPassword),
  birthDate: '01-01-1970',
  cpf: '28',
};
// const newUser: CreateUserInput = {
//   name: 'new',
//   email: 'new-email@example.com',
//   password: encrypt(unencryptedPassword),
//   birthDate: '01-01-1970',
//   cpf: '28',
// };

export default function getUsers() {
  const getUsers = (input?: GetUsersInput) => {
    return this.request
      .post('/')
      .auth(this.token, { type: 'bearer' })
      .send({
        query: `
          query getUsers($data: GetUsersInput!) {
            users(data: $data) {
              hasMore
              users {
                id
                name
                email
                birthDate
                cpf
              }
            }
          }
        `,
        variables: {
          data: {
            ...input,
          },
        },
      });
  };

  const parseDatabaseUsers = (users: User[]) =>
    users.map((user) => {
      delete user.password;
      return user;
    });

  const verifyGetUsers = async (count = 10, skip?: number) => {
    const [databaseUsers, getUsersResponse] = await Promise.all([
      this.userRepository.find({ take: count, skip, order: { name: 'ASC' } }),
      getUsers({ count, skip }),
    ]);
    const expectedUsers = parseDatabaseUsers(databaseUsers);

    expect(expectedUsers).to.deep.equal(getUsersResponse.body.data.users.users);
  };

  let existingUsersCount: number;

  beforeEach(async () => {
    await this.userRepository.save({ ...existingUser });

    this.token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '2s' });

    existingUsersCount = await this.userRepository.count();
  });

  afterEach(async () => {
    await this.userRepository.delete({ email: existingUser.email });
  });

  it('Gets users', async () => {
    await verifyGetUsers();
  });

  it(`Gets all users`, async () => {
    await verifyGetUsers(existingUsersCount);
  });

  it(`Fails to get users without a valid this.token`, async () => {
    const oldToken = this.token;
    this.token = '';

    const getUsersResponse = await getUsers();
    expect(getUsersResponse.body).to.have.property('errors');

    this.token = oldToken;
  });

  describe('Pagination', () => {
    const pageSize = 50;

    it('Gets users from the beggining of the list', async () => {
      const count = pageSize;
      const skip = 0;

      await verifyGetUsers(count, skip);
    });

    it('Gets users from the middle of the list', async () => {
      const count = pageSize;
      const skip = pageSize;

      await verifyGetUsers(count, skip);
    });

    it('Gets users from the end of the list', async () => {
      const count = pageSize;
      const skip = existingUsersCount - pageSize / 2;

      await verifyGetUsers(count, skip);
    });

    it('Gets users from beyond the end of the list', async () => {
      const count = pageSize;
      const skip = existingUsersCount + 1;

      await verifyGetUsers(count, skip);
    });
  });
}
