import sequelizePkg from "sequelize";
const { Model } = sequelizePkg;

export class RefreshToken extends Model {
  public publicAddress!: string;
  public token!: string;
  public revoked!: boolean;
}
