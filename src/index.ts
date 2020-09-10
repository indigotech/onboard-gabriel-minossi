import { setupGraphQL, setupTypeORM } from '@src/server-setup';

Promise.all([
    setupGraphQL(),
    setupTypeORM()
]).then(() => console.log(`GraphQLServer is running on http://${process.env.URL}`));
