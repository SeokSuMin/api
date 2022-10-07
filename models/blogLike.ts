import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface IBlogLikePropety {
    like_id: number | null;
    board_id: string;
    user_id: string;
}

class BlogLike extends Model<IBlogLikePropety> {
    public like_id!: number;
    public board_id!: string;
    public user_id!: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

BlogLike.init(
    {
        like_id: {
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
        tableName: 'blog_like',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    db.BlogLike.belongsTo(db.Blog, { foreignKey: 'board_id', as: 'blog_likes' });
};

export default BlogLike;
