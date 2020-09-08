import { graphQLServer } from 'src/graphql-setup';
import { createConnection } from "typeorm";


createConnection('default').then(() => {
    graphQLServer.start(() => console.log(`Server is running on http://localhost:4000`));
}).catch(() => {
    (error: Error) => console.error('Error connecting to databse: ' + error);
});
