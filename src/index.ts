import { createConnection } from "typeorm";
import { graphQLServer } from './graphQLSetup';

createConnection('default').then(() => {
    graphQLServer.start(() => console.log(`Server is running on http://localhost:4000`));
}).catch(() => {
    error => console.error('Error connecting to databse: ' + error);
});
