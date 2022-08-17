import User, { associate as associateUser } from './user';
import Blog, { associate as associateBlog } from './blog';
import BoardFile, { associate as associateBoardFile } from './file';

const db = {
    User,
    Blog,
    BoardFile,
};

export * from './sequelize';

export type dbType = typeof db;
associateUser(db);
associateBlog(db);
associateBoardFile(db);
