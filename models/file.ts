import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface IBolgPropety {
    file_id: number;
    board_id: string;
    name: string;
}

class BoardFile extends Model<IBolgPropety> {
    public file_id!: number;
    public board_id!: string;
    public name!: string;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

BoardFile.init(
    {
        file_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        board_id: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'board_file',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    db.BoardFile.belongsTo(db.Blog, { foreignKey: 'board_id' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'followingId' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'followerId' });
};

export default BoardFile;
