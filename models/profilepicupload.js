const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const ProfilePicUpload = sequelize.define(
  "ProfilePicUpload",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "profile_pics",
    timestamps: false,
  }
);

module.exports = ProfilePicUpload;
