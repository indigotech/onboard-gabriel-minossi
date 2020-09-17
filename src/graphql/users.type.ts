import { Field, Int, ObjectType } from 'type-graphql';
import { User } from './user.type';

@ObjectType({ description: 'Objeto de retorno de users' })
export class Users {
  @Field(() => [User], { description: 'Usuários em ordem alfabética' })
  users: User[];

  @Field({ description: 'Se há mais usuários no sistema' })
  hasMore: boolean;

  @Field(() => Int, { description: 'Quantos usuários foram pulados' })
  skippedUsers: number;

  @Field(() => Int, { description: 'Quantos usuários há no sistema' })
  totalUsers: number;
}
