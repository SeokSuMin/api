import * as db from 'sequelize';
import config from '../config/config';

const env = (process.env.NODE_ENV as 'production') || 'development';
const { database, username, password, host, dialect } = config[env];

const sequelize = new db.Sequelize(database, username, password, config[env]);

export { sequelize };
export default db;
