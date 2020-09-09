import { User } from '@src/entity/User';
import { formatError } from '@src/error';
import { graphQLServerPromise } from '@src/graphql-setup';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import * as supertest from 'supertest';
import { createConnection, getConnection, getRepository } from 'typeorm';


dotenv.config({ path: process.cwd() + '/.env' + (process.env.NODE_ENV && '.' + process.env.NODE_ENV) });

type UserInput = {
    name: string
    email: string
    password: string
    birthDate: string
    cpf: number
};

let request: supertest.SuperTest<supertest.Test>;
const setup = async () => {
    try {
        await Promise.all([
            createConnection({ url: process.env.TYPEORM_URL, type: 'postgres', entities: [User] }),
            graphQLServerPromise
        ]);
        console.log(`Server is running on ${process.env.URL}`);
        request = supertest(process.env.URL);
    } catch (error) {
        throw formatError(503, 'Are you sure the Docker database container is up?', error)
    }
}

setup().then(async () => {
    const userRepository = getRepository(User);
    const unencryptedPassword = "Supersafe";
    const existingUser: UserInput = {
        name: "existing",
        email: "existing-email@example.com",
        password: bcrypt.hashSync(unencryptedPassword, bcrypt.genSaltSync(6)),
        birthDate: "01-01-1970",
        cpf: 12345678910
    };
    const newUser: UserInput = {
        name: "new",
        email: "new-email@example.com",
        password: unencryptedPassword,
        birthDate: "01-01-1970",
        cpf: 28
    };

    await userRepository.save({ ...existingUser });
    const token = (await request.post('/')
        .send({
            query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token } }`,
            variables: { email: existingUser.email, password: unencryptedPassword }
        })).body.data.login.token;

    const users: UserInput[] = [];

    for (let nUsers = 0; nUsers < 50; nUsers++) {
        const name = faker.name.firstName();
        const unencryptedPassword = faker.random.alphaNumeric(7);

        users.push({
            name,
            email: `${name}@domain.com`,
            password: unencryptedPassword.charAt(0).toUpperCase + unencryptedPassword.slice(1),
            birthDate: `${faker.date.past()}`,
            cpf: faker.random.number(4294967296), // TODO: Change cpf to string
        });
    }

    await Promise.all(users.map((user) => {
        return request.post('/')
            .auth(token, { type: 'bearer' })
            .send({
                query: `mutation createUser($user: UserInput!) { createUser(user: $user) { id name email birthDate cpf } }`,
                variables: { user }
            });
    }));

    (await graphQLServerPromise).close();
    await getConnection().close();
}).catch(async (error) => {
    console.log(error);

    (await graphQLServerPromise).close();
    await getConnection().close();
});
