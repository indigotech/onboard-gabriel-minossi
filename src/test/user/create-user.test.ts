import { CreateUserInput } from '@src/api/graphql/user/create-user.input';
import { User } from '@src/data/entity/User';
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

export default function createUser() {
  const createUser = (user: CreateUserInput) => {
    return this.request
      .post('/')
      .auth(this.token, { type: 'bearer' })
      .send({
        query: `
          mutation createUser($data: CreateUserInput!) {
            createUser(data: $data) {
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
            ...user,
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

  it('Creates a new specified user for an user logged in correctly', async () => {
    const expectedUser = { ...newUser };
    delete expectedUser.password;

    const mutationUser = (await createUser(newUser)).body.data.createUser;
    delete mutationUser.id;

    expect(mutationUser).to.deep.equal(expectedUser);
  });

  it('Logs in to an user account after creation', async () => {
    const expectedUser = { ...newUser };
    delete expectedUser.password;

    const createdUser = (await createUser(newUser)).body.data.createUser;
    const mutationUser = (
      await this.request.post('/').send({
        query: `mutation login($data: LoginInput!) { login(data: $data) { user { name email birthDate cpf } } }`,
        variables: { data: { email: createdUser.email, password: unencryptedPassword } },
      })
    ).body.data.login.user;

    expect(mutationUser).to.deep.equal(expectedUser);
  });

  it('Fails to create a new user with an already registered email', async () => {
    const createUserResponse = await createUser(existingUser);

    expect(createUserResponse.body).to.have.property('errors');
    expect(createUserResponse.body.errors[0].code).to.equal(400);
  });

  it('Fails to create a new user if user is not logged in', async () => {
    const oldToken = this.token;
    this.token = '';

    const createUserResponse = await createUser(newUser);

    expect(createUserResponse.body).to.have.property('errors');
    expect(createUserResponse.body.errors[0].code).to.equal(401);

    this.token = oldToken;
  });

  it('Fails to create a new user with an invalid email', async () => {
    const invalidUser = { ...newUser };
    invalidUser.email = 'shortmail';
    const createUserResponse = await createUser(invalidUser);

    expect(createUserResponse.body).to.have.property('errors');
    expect(createUserResponse.body.errors[0].code).to.equal(400);
  });

  it('Fails to create a new user with a weak password', async () => {
    const invalidUser = { ...newUser };
    invalidUser.password = 'shortpass';

    const createUserResponse = await createUser(invalidUser);

    expect(createUserResponse.body).to.have.property('errors');
    expect(createUserResponse.body.errors[0].code).to.equal(400);
  });

  describe('Empty fields', () => {
    const verifyEmptyField = async (field: keyof User) => {
      const invalidUser = { ...newUser };
      invalidUser[`${field}`] = undefined;
      const createUserResponse = await createUser(invalidUser);
      expect(createUserResponse.body, 'Error expected').to.have.property('errors');
    };

    it('Fails if name is empty', () => {
      verifyEmptyField('name');
    });

    it('Fails if email is empty', () => {
      verifyEmptyField('email');
    });

    it('Fails if password is empty', () => {
      verifyEmptyField('password');
    });

    it('Fails if birthDate is empty', () => {
      verifyEmptyField('birthDate');
    });

    it('Fails if cpf is empty', () => {
      verifyEmptyField('cpf');
    });
  });
}
