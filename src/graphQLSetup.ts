import { GraphQLServer } from "graphql-yoga";
import * as jwt from 'jsonwebtoken';
import { getRepository, Repository } from "typeorm";
import { User } from "./entity/User";

const typeDefs = `
type Query {
    hello: String
}

type Mutation {
    login(email: String!, password: String!, rememberMe: Boolean): Login
    createUser(user: UserInput!): User!
}

type User {
    id: ID!
    name: String!
    email: String!
    birthDate: String!
    cpf: Int!
}

input UserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String!
    cpf: Int!
}

type Login {
    user: User!
    token: String!
}
`;

const getVerification = async (auth) => {
    if (!auth) {
        throw new jwt.JsonWebTokenError('you must be logged in!');
    }

    const token = auth.split('Bearer ')[1];
    if (!token) {
        throw new jwt.JsonWebTokenError('you should provide a token!');
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            throw new jwt.JsonWebTokenError('invalid token!');
        }
        return decoded;
    });
    return verification;
};

const resolvers = {
    Query: {
        hello: () => 'Hello!'
    },
    Mutation: {
        login: async (_: any, { email, password, rememberMe }) => {
            const userRepository: Repository<User> = getRepository(User);

            let user: User;
            console.log("Searching for user on the database...");
            try {
                user = await userRepository.findOneOrFail({ where: { email } });
            } catch {
                throw new Error('Invalid Credentials')
            }
            if (password !== user.password) {
                throw new Error('Invalid Credentials')
            } else {
                const token = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET,
                    { expiresIn: rememberMe ? "1w" : "1h" }
                );
                return ({ user, token, })
            }
        },

        createUser: (_, { user }) => {
            const userRepository = getRepository(User);
            user = {
                name: user.name,
                email: user.email.toLowerCase(),
                password: user.password,
                birthDate: user.birthDate,
                cpf: user.cpf,
            }
            return userRepository.save(user);
        }
    },
};

export const graphQLServer = new GraphQLServer({
    typeDefs,
    resolvers,
});