import sequelizePkg from "sequelize";
import { v4 as uuid } from "uuid";
import { config } from "./config.js";
import { User, RefreshToken } from "./models/index.js";

const { BOOLEAN, UUID, Sequelize, TEXT } = sequelizePkg;

const sequelize = new Sequelize(
  config.database.postgres.name,
  config.database.postgres.username,
  config.database.postgres.password,
  config.database.postgres.sequelize as sequelizePkg.Options
);

// Init all models
User.init(
  {
    nonce: {
      allowNull: false,
      type: UUID,
      defaultValue: (): string => uuid(), // Initialize with a random nonce
    },
    address: {
      allowNull: false,
      type: TEXT,
      unique: true,
      primaryKey: true,
      validate: { isLowercase: true },
    },
    username: {
      type: TEXT,
      unique: true,
    },
  },
  {
    tableName: "users",
    modelName: "user",
    sequelize, // This bit is important
    timestamps: false,
  }
);

RefreshToken.init(
  {
    id: {
      allowNull: false,
      type: UUID,
      primaryKey: true,
    },
    address: {
      allowNull: false,
      type: TEXT,
    },
    token: {
      allowNull: false,
      type: TEXT,
    },
    revoked: {
      allowNull: false,
      type: BOOLEAN,
      defaultValue: (): boolean => false,
    },
  },
  {
    tableName: "refresh_tokens",
    modelName: "refreshToken",
    sequelize,
    timestamps: false,
  }
);

User.hasMany(RefreshToken, {
  foreignKey: "address",
});
RefreshToken.belongsTo(User, {
  foreignKey: "address",
});

if (config.database.sync) {
  // Create new tables
  sequelize.sync();
}

export { sequelize };
