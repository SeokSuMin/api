import User, { associate as associateUser } from './user';
import Blog, { associate as associateBlog } from './blog';

const db = {
    User,
    Blog,
};

export * from './sequelize';

export type dbType = typeof db;
associateUser(db);
