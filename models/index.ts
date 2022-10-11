import User, { associate as associateUser } from './user';
import Blog, { associate as associateBlog } from './blog';
import Categori, { associate as associateCategori } from './categori';
import BoardFile, { associate as associateBoardFile } from './file';
import BoardComment, { associate as associateBoardComment } from './comment';
import Menu, { associate as associateMenu } from './menu';
import BlogLike, { associate as associateblogLike } from './blogLike';
import BlogFavorite, { associate as associateblogFavorite } from './blogFavorite';

const db = {
    User,
    Blog,
    BoardFile,
    Categori,
    BoardComment,
    Menu,
    BlogLike,
    BlogFavorite,
};

export * from './sequelize';

export type dbType = typeof db;
associateUser(db);
associateBlog(db);
associateCategori(db);
associateBoardFile(db);
associateBoardComment(db);
associateMenu(db);
associateblogLike(db);
associateblogFavorite(db);
