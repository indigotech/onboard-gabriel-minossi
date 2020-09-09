import { User } from '@src/entity/User';
import { formatError } from '@src/error';
import { graphQLServerPromise } from '@src/graphql-setup';
import * as dotenv from 'dotenv';
import { createConnection } from 'typeorm';


dotenv.config({ path: process.cwd() + '/.env' + (process.env.NODE_ENV && '.' + process.env.NODE_ENV) });

const setup = async () => {
    try {
        await Promise.all([
            createConnection({ url: process.env.TYPEORM_URL, type: 'postgres', entities: [User] }),
            graphQLServerPromise
        ]);
        console.log(`Server is running on ${process.env.URL}`);
    } catch (error) {
        throw formatError(503, 'Are you sure the Docker database container is up?', error)
    }
};

setup();
