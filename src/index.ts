import "reflect-metadata";
import { createConnection, Repository, getRepository } from "typeorm";
import { User } from "./entity/User";
import { GraphQLServer } from "graphql-yoga"
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = "SICRET"

const typeDefs = `
type Query {
    info: String
}

type Mutation {
  login(email: String!, password: String!, rememberMe: Boolean): Login
}

type User {
    id: ID!
    name: String!
    email: String
    birthDate: String!
    cpf: Int!
}

type Login {
    user: User!
    token: String!
}
`;

// Simply take an auth header and returns the user.
const getUser = async auth => {
    if (!auth) { 
        throw new jwt.JsonWebTokenError('you must be logged in!'); 
    }

    const token = auth.split('Bearer ')[1];
    if (!token) { 
        throw new jwt.JsonWebTokenError('you should provide a token!'); 
    }

    const user = jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) { 
            throw new jwt.JsonWebTokenError('invalid token!'); 
        }
        return decoded;
    });
    return user;
};

const resolvers = {
    Mutation: {
        login: async (_: any, { email, password, rememberMe }) => {
            const userRepository: Repository<User> = getRepository(User);

            let user: User;
            console.log("Searching for user on the database...");
            try {
                user = await userRepository.findOneOrFail({ where: { email } });
            } catch {
                console.log('Invalid credentials');
                throw new Error('Invalid Credentials')
            }
            if (password !== user.password) {
                throw new Error('Invalid Credentials')
            } else {
                const token = jwt.sign(
                    { id: user.id },
                    JWT_SECRET,
                    { expiresIn: rememberMe ? "1w" : "1h" }
                );
                return ({ user, token, })
            }
        },
    },
};

const server = new GraphQLServer({
    typeDefs,
    resolvers,
});

createConnection().then(() => {
    server.start(() => console.log(`Server is running on http://localhost:4000`));
}).catch(error => console.log('Error connecting to databse: ' + error));
