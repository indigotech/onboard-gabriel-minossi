import { Field, ID, ObjectType, Int } from 'type-graphql';

export interface UserModel {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  cpf: string;
}

@ObjectType()
export class User implements UserModel {
  @Field(() => ID, { description: 'User id' })
  id: string;

  @Field({ description: 'User name' })
  name: string;

  @Field({ description: 'User email' })
  email: string;

  @Field({ description: 'User birth date' })
  birthDate: string;

  @Field({ description: 'User cpf' })
  cpf: string;
}

@ObjectType()
export class Users {
  @Field(() => [User], { description: 'User id' })
  users: User[];

  @Field({ description: 'User name' })
  hasMore: boolean;

  @Field(() => Int, { description: 'User name' })
  skippedUsers: number;

  @Field(() => Int, { description: 'User name' })
  TtotalUsers: number;
}
