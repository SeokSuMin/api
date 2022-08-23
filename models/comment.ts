import { Model, DataTypes } from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

interface ICommentPropety {
    comment_id: number;
    board_id: string;
    parent_id: number | null;
    content: string;
    parent_user_id: string;
    modify_flag: boolean;
    user_id: string;
}

class BoardComment extends Model<ICommentPropety> {
    public comment_id!: number;
    public board_id?: string;
    public parent_id!: number;
    public content!: string;
    public parent_user_id!: string;
    public user_id!: string;
    public modify_flag!: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
}

BoardComment.init(
    {
        comment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        board_id: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
            // references: {
            //     model: 'blog',
            //     key: 'board_id',
            // },
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        parent_user_id: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        modify_flag: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'board_comment',
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
    },
);
export const associate = (db: dbType) => {
    db.BoardComment.belongsTo(db.Blog, { foreignKey: 'board_id' });
};

export default BoardComment;
