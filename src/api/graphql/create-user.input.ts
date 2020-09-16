import { UserInputModel } from '@src/business/model/user.model';
import { Field, InputType } from 'type-graphql';

@InputType({ description: 'Objeto de entrada para a criação de um novo usuário' })
export class CreateUserInput implements UserInputModel {
  @Field({ description: 'Nome do novo usuário' })
  name: string;

  @Field({ description: 'Email do novo usuário' })
  email: string;

  @Field({ description: 'Senha do novo usuário' })
  password: string;

  @Field({ description: 'Data de nascimento do novo usuário' })
  birthDate: string;

  @Field({ description: 'CPF do novo usuário' })
  cpf: string;
}
