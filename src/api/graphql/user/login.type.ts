import { User } from '@src/api/graphql/user/user.type';
import { LoginModel } from '@src/business/model/user.model';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'Objeto de resposta ao login' })
export class Login implements LoginModel {
  @Field({ description: 'JWT token' })
  token: string;

  @Field(() => User, { description: 'Informações do usuário autenticado' })
  user: User;
}
