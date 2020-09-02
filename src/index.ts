import "reflect-metadata";
// import { createConnection } from "typeorm";
// import { User } from "./entity/User";
import { GraphQLServer } from "graphql-yoga"

//Mocked data
const user = {
    "id": "12",
    "name": "User Name",
    "email": "User e-mail",
    "birthDate": "04-25-1990",
    "cpf": "01234567890",
};

const typeDefs = `
type Query {
  login: Login!
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
    token: String
}
`;

const resolvers = {
    Mutation: {
        login: () => ({ user, token: 'the_token', })
    },
};

const server = new GraphQLServer({
    typeDefs,
    resolvers,
});

server.start(() => console.log(`Server is running on http://localhost:4000`));

// createConnection().then(async connection => {

//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);

// }).catch(error => console.log(error));
