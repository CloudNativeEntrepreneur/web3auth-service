import { Model } from 'sequelize';

export class User extends Model {
	public publicAddress!: string;
	public nonce!: string;
	public username?: string; // for nullable fields
}
