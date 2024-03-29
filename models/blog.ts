import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface IBolgPropety {
    board_id: string;
    categori_id: number;
    title: string;
    content?: string;
    writer: string;
    thumb_img_name?: string;
}

class Blog extends Model<IBolgPropety> {
    public board_id!: string;
    public categori_id!: number;
    public title!: string;
    public content?: string;
    public writer!: string;
    public thumb_img_name?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

Blog.init(
    {
        board_id: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        categori_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // primaryKey: true,
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
        thumb_img_name: {
            type: DataTypes.TEXT,
            allowNull: true,
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
    db.Blog.hasMany(db.BoardFile, { foreignKey: 'board_id', as: 'board_files', onDelete: 'cascade' });
    db.Blog.hasMany(db.BoardComment, { foreignKey: 'board_id', as: 'comments', onDelete: 'cascade' });
    db.Blog.hasMany(db.BlogLike, { foreignKey: 'board_id', as: 'blog_likes', onDelete: 'cascade' });
    db.Blog.hasMany(db.BlogFavorite, { foreignKey: 'board_id', as: 'blog_favorite', onDelete: 'cascade' });
    db.Blog.belongsTo(db.Categori, { foreignKey: 'categori_id', as: 'categoris' });
};

export default Blog;
