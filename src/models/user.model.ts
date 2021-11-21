import { Model } from 'sequelize';

export class User extends Model {
	public publicAddress!: string;
	public nonce!: number;
	public username?: string; // for nullable fields
}
