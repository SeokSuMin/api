import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as morgen from 'morgan';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as expressSession from 'express-session';
import * as dotenv from 'dotenv';
import * as passport from 'passport';
import passportConfig from './passport';
import * as hpp from 'hpp';
import helmet from 'helmet';
import { sequelize } from './models';

import userRouter from './routes/user';
import blogRouter from './routes/blog';

dotenv.config();
const app = express();
const prod: boolean = process.env.NODE_ENV === 'production';

app.set('port', prod ? process.env.PORT : 3005);

passportConfig();

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
            origin: /tteoksang\.site$/,
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
            domain: prod ? '.tteoksang.site' : undefined,
        },
        name: 'smje',
    }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send('api server!');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).send('서버 에러 발생! 서버 콘솔을 확인하세요.');
});

if (prod) {
    app.listen(app.get('port'), () => {
        console.log('server is running on https://api.tteoksang.site:3005');
    });
} else {
    app.listen(app.get('port'), () => {
        console.log(`server is ruuning on ${app.get('port')}`);
    });
}

app.use('/api/user', userRouter);
app.use('/api/blog', blogRouter);
