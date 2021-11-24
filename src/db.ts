import sequelizePkg from "sequelize";
import { v4 as uuid } from "uuid";
import { config } from "./config.js";
import { User, RefreshToken } from "./models/index.js";

const { BOOLEAN, UUID, Sequelize, STRING, TEXT } = sequelizePkg;

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
    modelName: "user",
    sequelize, // This bit is important
    timestamps: false,
  }
);

RefreshToken.init(
  {
    publicAddress: {
      allowNull: false,
      type: STRING,
    },
    token: {
      allowNull: false,
      type: TEXT,
      primaryKey: true,
    },
    revoked: {
      allowNull: false,
      type: BOOLEAN,
      defaultValue: (): boolean => false,
    },
  },
  {
    modelName: "refreshToken",
    sequelize,
    timestamps: false,
  }
);

User.hasMany(RefreshToken, {
  foreignKey: "publicAddress",
});
RefreshToken.belongsTo(User, {
  foreignKey: "publicAddress",
});

// Create new tables
sequelize.sync();

export { sequelize };
