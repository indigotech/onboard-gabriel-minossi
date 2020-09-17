export interface UserInputModel {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  cpf: string;
}

export interface UserModel {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  cpf: string;
}

export interface UserTokenData {
  id: string;
}

export interface LoginModel {
  token: string;
  user: UserModel;
}
