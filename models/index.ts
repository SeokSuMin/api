import User, { associate as associateUser } from './user';

const db = {
    User,
};

export * from './sequelize';

export type dbType = typeof db;
associateUser(db);
