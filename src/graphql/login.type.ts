import { LoginModel } from '@src/model/user.model';
import { Field, ObjectType } from 'type-graphql';
import { User } from './user.type';

@ObjectType({ description: 'Login response object' })
export class Login implements LoginModel {
  @Field({ description: 'JWT token' })
  token: string;

  @Field(() => User, { description: 'User' })
  user: User;
}
