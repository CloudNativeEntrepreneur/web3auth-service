import sequelizePkg from "sequelize";
const { Model } = sequelizePkg;

export class RefreshToken extends Model {
  public id!: string;
  public address!: string;
  public token!: string;
  public revoked!: boolean;
}
