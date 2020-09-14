import * as bcrypt from 'bcrypt';

export const encrypt = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(6));
};
