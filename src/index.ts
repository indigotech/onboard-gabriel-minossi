import "reflect-metadata";
import { createConnection, Repository, getRepository } from "typeorm";
import { User } from "./entity/User";
import { GraphQLServer } from "graphql-yoga"

//Mocked data
const user: User = {
    "id": 12,
    "name": "User Name",
    "email": "User e-mail",
    "birthDate": "04-25-1990",
    "cpf": 1234567890,
    password: 'chumbada'
};

const typeDefs = `
type Query {
    info: String
}

type Mutation {
  login(email: String!, password: String!): Login
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

const resolvers = {
    Mutation: {
        login: async (_: any, { email, password }) => {
            try {
                const userRepository: Repository<User> = getRepository(User);

                console.log("Searching for user on the database...");
                const user: User = await userRepository.findOneOrFail({
                    //select: ["id", "name", "email", "birthDate", "cpf"],
                    where: { email, password }
                });
                user && console.log("Found user with id: " + user.id);
                return ({ user, token: 'the_token', })
            } catch (error) {
                console.log('\nNo user found. Check your credentials');
            }
        },
    },
};

const server = new GraphQLServer({
    typeDefs,
    resolvers,
});

createConnection().then(async connection => {
    server.start(() => console.log(`Server is running on http://localhost:4000`));
}).catch(error => console.log('Error connecting to databse: ' + error));
