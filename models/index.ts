import User, { associate as associateUser } from './user';
import Blog, { associate as associateBlog } from './blog';
import Categori, { associate as associateCategori } from './categori';
import BoardFile, { associate as associateBoardFile } from './file';
import BoardComment, { associate as associateBoardComment } from './comment';
import Menu, { associate as associateMenu } from './menu';

const db = {
    User,
    Blog,
    BoardFile,
    Categori,
    BoardComment,
    Menu,
};

export * from './sequelize';

export type dbType = typeof db;
associateUser(db);
associateBlog(db);
associateCategori(db);
associateBoardFile(db);
associateBoardComment(db);
associateMenu(db);
