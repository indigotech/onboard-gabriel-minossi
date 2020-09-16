import { UserInputModel } from '@src/model/user.model';
import { Field, InputType } from 'type-graphql';

@InputType()
export class CreateUserInput implements UserInputModel {
  @Field({ description: 'User name' })
  name: string;

  @Field({ description: 'User email' })
  email: string;

  @Field({ description: 'User password' })
  password: string;

  @Field({ description: 'User birth date' })
  birthDate: string;

  @Field({ description: 'User cpf' })
  cpf: string;
}
