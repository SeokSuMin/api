import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface IBolgPropety {
    board_id: number;
    title: string;
    content?: string;
    writer: string;
    menu_categori: string;
    categori: string;
}

class Blog extends Model<IBolgPropety> {
    public board_id!: number;
    public title!: string;
    public content?: string;
    public writer!: string;
    public menu_categori!: string;
    public categori!: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

Blog.init(
    {
        board_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        writer: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        menu_categori: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        categori: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'blog',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    // db.Blog.hasMany(db.Post, { as: 'Posts' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'followingId' });
    // db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'followerId' });
};

export default Blog;
