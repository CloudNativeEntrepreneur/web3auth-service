import sequelizePkg from "sequelize";
const { Model } = sequelizePkg;

export class RefreshToken extends Model {
  public userPublicAddress!: string;
  public token!: string;
  public revoked!: boolean;
}
