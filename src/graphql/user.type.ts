import { UserModel } from '@src/model/user.model';
import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType({ description: 'Informações de um usuário existente' })
export class User implements UserModel {
  @Field(() => ID, { description: 'Id do usuário' })
  id: string;

  @Field({ description: 'Nome do usuário' })
  name: string;

  @Field({ description: 'Email do usuário' })
  email: string;

  @Field({ description: 'Data de nascimento do usuário' })
  birthDate: string;

  @Field({ description: 'CPF do usuário' })
  cpf: string;
}
