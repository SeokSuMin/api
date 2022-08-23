import User, { associate as associateUser } from './user';
import Blog, { associate as associateBlog } from './blog';
import Categori, { associate as associateCategori } from './Categori';
import BoardFile, { associate as associateBoardFile } from './file';
import BoardComment, { associate as associateBoardComment } from './comment';

const db = {
    User,
    Blog,
    BoardFile,
    Categori,
    BoardComment,
};

export * from './sequelize';

export type dbType = typeof db;
associateUser(db);
associateBlog(db);
associateCategori(db);
associateBoardFile(db);
associateBoardComment(db);
