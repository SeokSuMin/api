import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as morgen from 'morgan';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as expressSession from 'express-session';
import * as dotenv from 'dotenv';
import * as passport from 'passport';
import * as hpp from 'hpp';
import helmet from 'helmet';

import { sequelize } from './models';

dotenv.config();
const app = express();
const prod: boolean = process.env.NODE_ENV === 'production';

app.set('port', prod ? process.env.PORT : 3065);

sequelize
    .sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결완료');
    })
    .catch((err: Error) => {
        console.log('err: ' + err.message);
    });

if (prod) {
    app.use(hpp());
    app.use(helmet());
    app.use(morgen('combined'));
    app.use(
        cors({
            origin: /nodebird\.com$/,
            credentials: true,
        }),
    );
} else {
    app.use(morgen('dev'));
    app.use(
        cors({
            origin: true,
            credentials: true,
        }),
    );
}

app.use('/', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECERET));
app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.COOKIE_SECERET as string,
        cookie: {
            httpOnly: true,
            secure: false,
            domain: prod ? '.nodebird.com' : undefined,
        },
        name: 'rnbck',
    }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send('react 백엔드!');
});

app.listen(app.get('port'), () => {
    console.log(`server is ruuning on ${app.get('port')}`);
});
