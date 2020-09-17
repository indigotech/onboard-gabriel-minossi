import { User } from '@src/data/entity/User';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { DataSource } from './datasource';

@Service()
export class UserDbDataSource extends DataSource<User> {
  constructor(@OrmRepository(User) protected dbOrmRepository: Repository<User>) {
    super(dbOrmRepository);
  }
}
