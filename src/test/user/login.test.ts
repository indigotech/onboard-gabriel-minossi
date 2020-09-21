import { CreateUserInput } from '@src/api/graphql/user/create-user.input';
import { LoginInput } from '@src/api/graphql/user/login.input';
import { encrypt } from '@src/helpers';
import { expect } from 'chai';
import * as jwt from 'jsonwebtoken';
import { UserTokenData } from '@src/business/model/user.model';

const unencryptedPassword = 'Supersafe';
const existingUser: CreateUserInput = {
  name: 'test',
  email: 'test-email@example.com',
  password: encrypt(unencryptedPassword),
  birthDate: '01-01-1970',
  cpf: '28',
};
const correctCredentials: LoginInput = {
  email: existingUser.email,
  password: unencryptedPassword,
};
const wrongCredentials: LoginInput = {
  email: existingUser.email.split('').reverse().join(''),
  password: unencryptedPassword.split('').reverse().join(''),
};

export default function login() {
  const login = (credentials: LoginInput) => {
    return this.request.post('/').send({
      query: `
        mutation login($data: LoginInput!) {
          login(data: $data) {
            token
            user {
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
          email: credentials.email,
          password: credentials.password,
        },
      },
    });
  };

  beforeEach(async () => {
    await this.userRepository.save({ ...existingUser });
  });

  afterEach(async () => {
    await this.userRepository.delete({ email: existingUser.email });
  });

  it(`Successfully returns a valid token for user with correct credentials`, async () => {
    const loginResponse = await login(correctCredentials);
    const token = loginResponse.body.data.login.token;
    expect(token, 'Missing token').to.exist;
    const verification = jwt.verify(token, process.env.JWT_SECRET) as UserTokenData;
    expect(verification.id, 'Token does not match user information').to.equal(loginResponse.body.data.login.user.id);
  });

  it(`Successfully returns the right user for the correct credentials`, async () => {
    const expectedUser = { ...existingUser };
    delete expectedUser.password;

    const mutationUser = (await login(correctCredentials)).body.data.login.user;
    delete mutationUser.id;

    expect(mutationUser).to.deep.equal(expectedUser);
  });

  it(`Fails logging in for an existent email with a wrong password`, async () => {
    const credentials = {
      email: correctCredentials.email,
      password: wrongCredentials.password,
    };
    const loginResponse = await login(credentials);

    expect(loginResponse.body, 'Error expected').to.have.property('errors');
    expect(loginResponse.body.errors[0].code).to.equal(401);
  });

  it(`Fails logging in for an unexistent email and an existent password`, async () => {
    const credentials = {
      email: wrongCredentials.email,
      password: correctCredentials.password,
    };
    const loginResponse = await login(credentials);

    expect(loginResponse.body, 'Error expected').to.have.property('errors');
    expect(loginResponse.body.errors[0].code).to.equal(400);
  });
}
