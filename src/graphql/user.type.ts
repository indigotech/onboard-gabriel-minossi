import { UserModel } from '@src/model/user.model';
import { Field, ID, ObjectType } from 'type-graphql';

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
