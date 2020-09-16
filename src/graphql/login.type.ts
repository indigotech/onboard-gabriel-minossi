import { Field, ObjectType } from 'type-graphql';
import { User } from './user.type';

export interface LoginModel {
  token: string;
  user: User;
}

@ObjectType({ description: 'Login response object' })
export class Login implements LoginModel {
  @Field({ description: 'JWT token' })
  token: string;

  @Field(() => User, { description: 'User' })
  user: User;
}
