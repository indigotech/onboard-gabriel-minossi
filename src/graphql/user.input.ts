import { Field, InputType } from 'type-graphql';

export interface UserInputModel {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  cpf: string;
}

@InputType()
export class UserInput implements UserInputModel {
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
