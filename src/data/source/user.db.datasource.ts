import { User } from '@src/data/entity/User';
import { DataSource } from '@src/data/source/datasource';
import { encrypt } from '@src/helpers';
import { Service } from 'typedi';
import { DeepPartial, Repository } from 'typeorm';
import { OrmRepository } from 'typeorm-typedi-extensions';

@Service()
export class UserDbDataSource extends DataSource<User> {
  constructor(@OrmRepository(User) protected dbOrmRepository: Repository<User>) {
    super(dbOrmRepository);
  }
  async insert(user: DeepPartial<User>) {
    return super.insert({ ...user, password: encrypt(user.password) });
  }
}
