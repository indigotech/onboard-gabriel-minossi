import { GetUsersInputModel, UsersModel } from '@src/business/model/user.model';
import { UserUseCase } from '@src/business/rule/user/user.use-case';
import { Service } from 'typedi';

@Service()
export class GetUsersUseCase extends UserUseCase<GetUsersInputModel, UsersModel> {
  async exec(input: GetUsersInputModel): Promise<UsersModel> {
    const [users, usersCount] = await this.dataSource.findMany({
      take: input.count,
      skip: input.skip,
      order: { name: 'ASC' },
    });

    const hasMore = usersCount - input.skip - input.count > 0;

    return { users, hasMore, skippedUsers: input.skip, totalUsers: usersCount };
  }
}
