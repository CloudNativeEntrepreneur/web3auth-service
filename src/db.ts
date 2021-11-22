import os from 'os';
import path from 'path';
import { BOOLEAN, INTEGER, Sequelize, STRING } from 'sequelize';
import { v4 as uuid } from 'uuid'

import { User, RefreshToken } from './models';

const sequelize = new Sequelize('login-with-metamask-database', '', undefined, {
	dialect: 'sqlite',
	storage: path.join(os.tmpdir(), 'db.sqlite'),
	logging: false,
});

// Init all models
User.init(
	{
		nonce: {
			allowNull: false,
			type: INTEGER.UNSIGNED, // SQLITE will use INTEGER
			defaultValue: (): string => uuid(), // Initialize with a random nonce
		},
		publicAddress: {
			allowNull: false,
			type: STRING,
			unique: true,
			primaryKey: true,
			validate: { isLowercase: true },
		},
		username: {
			type: STRING,
			unique: true,
		},
	},
	{
		modelName: 'user',
		sequelize, // This bit is important
		timestamps: false,
	}
);

RefreshToken.init(
	{
		userPublicAddress: {
			allowNull: false,
			type: STRING,
		},
		token: {
			allowNull: false,
			type: STRING,
			primaryKey: true
		},
		revoked: {
			allowNull: false,
			type: BOOLEAN,
			defaultValue: () : boolean => false
		}
	},
	{
		modelName: 'refreshToken',
		sequelize,
		timestamps: false
	}
)

User.hasMany(RefreshToken, {
	foreignKey: 'userPublicAddress'
})
RefreshToken.belongsTo(User, {
	foreignKey: 'publicAddress'
})

// Create new tables
sequelize.sync();

export { sequelize };
