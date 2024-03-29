import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

export interface ICategoriPropety {
    categori_id: number;
    menu_id: number;
    categori_name?: string;
    sort: number;
}

class Categori extends Model<ICategoriPropety> {
    public categori_id!: number;
    public menu_id!: number;
    public categori_name!: string;
    public sort!: number;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

Categori.init(
    {
        categori_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        menu_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        categori_name: {
            type: DataTypes.TEXT,
            defaultValue: '기본 카테고리',
            allowNull: false,
        },
        sort: {
            type: DataTypes.INTEGER,
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
    db.Categori.hasMany(db.Blog, { foreignKey: 'categori_id', onDelete: 'cascade' });
    db.Categori.belongsTo(db.Menu, { foreignKey: 'menu_id' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'followingId' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'followerId' });
};

export default Categori;
