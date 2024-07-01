import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as morgen from 'morgan';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as expressSession from 'express-session';
import * as dotenv from 'dotenv';
import * as passport from 'passport';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import passportConfig from './passport';
import * as hpp from 'hpp';
import helmet from 'helmet';
import * as nodeShedule from 'node-schedule';
import { sequelize } from './models';

import userRouter from './routes/user';
import blogRouter from './routes/blog';
import { deleteFolder } from './util';
const RedisStore = connectRedis(expressSession);

dotenv.config();

console.log('1')
console.log('2')
console.log('3')

const app = express();
const prod: boolean = process.env.NODE_ENV === 'production';

// const redisClient = redis.createClient({
//     url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
//     legacyMode: true, // 반드시 설정 !! 설정 안하면 connect-redis 동작 안함
// });

// redisClient.on('connect', () => {
//     console.info('Redis connected!');
// });
// redisClient.on('error', (err) => {
//     console.error('Redis Client Error', err);
// });
// redisClient.connect().then(); // redis v4 연결 (비동기)
// const redisCli = redisClient.v4;

app.set('port', 3005);

passportConfig();
app.use('/', express.static('uploads'));

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECERET));

if (prod) {
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
            // store: new RedisStore({ client: redisClient, prefix: 'session:' }),
        }),
    );
} else {
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
}

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    // res.header('Cross-Origin-Opener-Policy', 'cross-origin');
    // res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).send('서버 에러 발생! 서버 콘솔을 확인하세요.');
});

if (prod) {
    app.listen(app.get('port'), () => {
        console.log('server is running on https://api.tteoksang.site:3005');
        nodeShedule.scheduleJob('0 10 0 * * *', () => {
            deleteFolder();
        });
    });
} else {
    app.listen(app.get('port'), () => {
        console.log(`server is ruuning on ${app.get('port')}`);
    });
}

app.use('/api/user', userRouter);
app.use('/api/blog', blogRouter);
