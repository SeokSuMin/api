import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface IBlogFavoritePropety {
    favorite_id: number | null;
    board_id: string;
    user_id: string;
}

class BlogFavorite extends Model<IBlogFavoritePropety> {
    public favorite_id!: number;
    public board_id!: string;
    public user_id!: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

BlogFavorite.init(
    {
        favorite_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        board_id: {
            type: DataTypes.TEXT,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'blog_favorite',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    db.BlogFavorite.belongsTo(db.Blog, { foreignKey: 'board_id', as: 'blog_favorite' });
};

export default BlogFavorite;
