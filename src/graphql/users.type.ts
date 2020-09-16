import { UsersModel } from '@src/model/user.model';
import { Field, Int, ObjectType } from 'type-graphql';
import { User } from './user.type';

@ObjectType()
export class Users implements UsersModel {
  @Field(() => [User], { description: 'User id' })
  users: User[];

  @Field({ description: 'User name' })
  hasMore: boolean;

  @Field(() => Int, { description: 'User name' })
  skippedUsers: number;

  @Field(() => Int, { description: 'User name' })
  totalUsers: number;
}
