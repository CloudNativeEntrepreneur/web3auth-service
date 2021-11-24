import sequelizePkg from "sequelize";
const { Model } = sequelizePkg;

export class User extends Model {
  public publicAddress!: string;
  public nonce!: string;
  public username?: string; // for nullable fields
}
