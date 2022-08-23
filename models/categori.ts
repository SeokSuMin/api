import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface ICategoriPropety {
    categori_id: number;
    menu_name: string;
    categori_name?: string;
}

class Categori extends Model<ICategoriPropety> {
    public categori_id!: number;
    public menu_name!: string;
    public categori_name!: string;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

Categori.init(
    {
        categori_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        menu_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        categori_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'categori',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    db.Categori.hasMany(db.Blog, { foreignKey: 'categori_id' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'followingId' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'followerId' });
};

export default Categori;
