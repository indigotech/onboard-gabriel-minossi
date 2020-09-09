import { User } from '@src/entity/User';
import { graphQLServer } from '@src/graphql-setup';
import { createConnection } from "typeorm";


createConnection({url: process.env.TYPEORM_URL, type:'postgres', entities:[User]}).then(() => {
    graphQLServer.start(() => console.log(`Server is running on http://localhost:4000`));
}).catch(() => {
    (error: Error) => console.error('Error connecting to databse: ' + error);
});
