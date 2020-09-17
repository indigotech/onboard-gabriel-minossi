import { CreateUserInput } from '@src/api/graphql/user/create-user.input';
import { GetUserInput } from '@src/api/graphql/user/get-user.input';
import { encrypt } from '@src/helpers';
import { expect } from 'chai';
import * as jwt from 'jsonwebtoken';

const unencryptedPassword = 'Supersafe';
const existingUser: CreateUserInput = {
  name: 'existing',
  email: 'existing-email@example.com',
  password: encrypt(unencryptedPassword),
  birthDate: '01-01-1970',
  cpf: '28',
};
const newUser: CreateUserInput = {
  name: 'new',
  email: 'new-email@example.com',
  password: unencryptedPassword,
  birthDate: '01-01-1970',
  cpf: '28',
};

export default function getUser() {
  const getUser = (input: GetUserInput) => {
    return this.request
      .post('/')
      .auth(this.token, { type: 'bearer' })
      .send({
        query: `
          query user($data: GetUserInput!) {
            user(data: $data) {
              id
              name
              email
              birthDate
              cpf
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

  beforeEach(async () => {
    await this.userRepository.save({ ...existingUser });

    this.token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '2s' });
  });

  afterEach(async () => {
    await this.userRepository.delete({ email: existingUser.email });
    await this.userRepository.delete({ email: newUser.email });
  });

  it('Gets an existing user', async () => {
    const expectedUser = { ...existingUser };
    delete expectedUser.password;

    const oldUser = await this.userRepository.findOne({ email: existingUser.email });
    const queryUser = (await getUser({ id: oldUser.id })).body.data.user;
    delete queryUser.id;

    expect(queryUser).to.deep.equal(expectedUser);
  });

  it("Gets a new user after it's creation", async () => {
    const createdUser = await this.userRepository.save({ ...newUser });
    const expectedUser = { ...createdUser };
    delete expectedUser.id;
    delete expectedUser.password;

    const queryUser = (await getUser({ id: createdUser.id })).body.data.user;
    delete queryUser.id;

    expect(queryUser).to.deep.equal(expectedUser);
  });

  it('Fails to get an user with an unexistent id', async () => {
    const getUserResponse = await getUser({ id: '' });

    expect(getUserResponse.body).to.have.property('errors');
    expect(getUserResponse.body.errors[0].code).to.equal(400);
  });

  it('Fails to get user if user is not logged in', async () => {
    const oldToken = this.token;
    this.token = '';

    const oldUser = await this.userRepository.findOne({ email: existingUser.email });
    const getUserResponse = await getUser({ id: oldUser.id });

    expect(getUserResponse.body).to.have.property('errors');

    this.token = oldToken;
  });
}
