import { Model } from 'sequelize';

export class RefreshToken extends Model {
	public userPublicAddress!: string;
	public token!: string;
	public revoked!: boolean;
}
