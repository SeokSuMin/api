import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface IUserPropety {
    userId: string;
    strategyType: string;
    email: string;
    password: string;
    imgPath: string;
}

class User extends Model<IUserPropety> {
    public userId!: string;
    public strategyType!: string;
    public email?: string;
    public password?: string;
    public imgPath?: string;
    public username?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

User.init(
    {
        userId: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        strategyType: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        email: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        imgPath: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'user',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    // db.User.hasMany(db.Post, { as: 'Posts' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'followingId' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'followerId' });
};

export default User;
