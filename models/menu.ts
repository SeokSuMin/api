import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

export interface IMenuPropety {
    menu_id: number;
    menu_name: string;
    sort: number;
}

class Menu extends Model<IMenuPropety> {
    public menu_id!: number;
    public menu_name!: string;
    public sort!: number;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

Menu.init(
    {
        menu_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        menu_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        sort: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'menu',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    db.Menu.hasMany(db.Categori, { foreignKey: 'menu_id', as: 'categoris', onDelete: 'cascade' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'followingId' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'followerId' });
};

export default Menu;
