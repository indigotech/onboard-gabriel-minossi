import { UsersInput } from '@src/api/graphql/users.input';
import { Users } from '@src/api/graphql/users.type';
import { UseCase } from '@src/business/rule/use-case';
import { UserDbDataSource } from '@src/data/source/user.db.datasource';
import { Container, Service } from 'typedi';

@Service()
export class UsersUseCase extends UseCase<UsersInput, Users> {
  protected readonly dataSource = Container.get(UserDbDataSource);

  async exec(input: UsersInput): Promise<Users> {
    const [users, usersCount] = await this.dataSource.findMany({
      take: input.count,
      skip: input.skip,
      order: { name: 'ASC' },
    });

    const hasMore = usersCount - input.skip - input.count > 0;

    return { users, hasMore, skippedUsers: input.skip, totalUsers: usersCount };
  }
}
