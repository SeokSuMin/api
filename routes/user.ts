import * as express from 'express';
import * as bcrypt from 'bcrypt';
import User from '../models/user';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as passport from 'passport';
import { isLoggiedIn, isNotLoggedIn } from './middleware';

const router = express.Router();
import * as dotenv from 'dotenv';
dotenv.config();

const clientUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.PRODUCTION_SERVER_URL?.replace('.api', '')
        : 'http://localhost:3004';

try {
    fs.accessSync(`uploads`);
} catch (error) {
    fs.mkdirSync(`uploads`);
}

const upload = multer({
    // 파일 저장
    storage: multer.diskStorage({
        destination(req, file, done) {
            // 파일 저장 경로설정
            const userId = req.body.userId;
            if (!fs.existsSync(`uploads/${userId}`)) {
                fs.mkdirSync(`uploads/${userId}`);
            }
            done(null, `uploads/${userId}`);
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext);
            done(null, baseName + ext);
        },
    }),
});

router.get('/', isLoggiedIn, async (req, res, next) => {
    try {
        const userInfo = req?.user?.toJSON() as User;
        delete userInfo?.password;
        return res.json(userInfo);
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.get('/adminInfo', async (req, res, next) => {
    try {
        const adminUserInfo = await User.findOne({
            where: {
                userId: 'iceMan',
            },
        });

        const userInfo = adminUserInfo as User;
        return res.json({ userId: userInfo.userId, imgPath: userInfo.imgPath });
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/check', isNotLoggedIn, async (req, res, next) => {
    try {
        const exUser = await User.findOne({
            where: {
                userId: req.body.userId,
            },
        });
        if (exUser) {
            return res.status(401).send('이미 사용중인 아이디 입니다');
        }
        return res.status(200).send('ok!');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/profileUpload', isNotLoggedIn, upload.single('file'), async (req, res, next) => {
    try {
        const userInfo = req.body;
        const hashedPassword = await bcrypt.hash(userInfo.password, 12);
        const filePath = req?.file?.originalname ? `${userInfo.userId}/${req.file.originalname}` : '';
        await User.create({
            userId: userInfo.userId,
            strategyType: 'local',
            email: userInfo.email,
            password: hashedPassword,
            imgPath: filePath,
        });

        return res.send('가입완료');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/login', isNotLoggedIn, async (req, res, next) => {
    passport.authenticate('local', (err: Error, user: User, info: { message: string }) => {
        if (err) {
            console.error(err);
            return next(err);
        }
        if (info) {
            return res.status(401).end(info.message);
        }
        return req.login(user, async (loginErr: Error) => {
            try {
                if (loginErr) {
                    return next(loginErr);
                } else {
                    const objUser = user.toJSON() as User;
                    delete objUser.password;
                    return res.json(objUser);
                }
            } catch (error) {
                console.error(error);
                return next(error);
            }
        });
    })(req, res, next);
});

router.get('/github/login', isNotLoggedIn, passport.authenticate('github'));

router.get(
    '/github/callback',
    passport.authenticate('github', { successRedirect: `${clientUrl}`, failureMessage: 'git Error' }),
);

router.get('/google/login', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { successRedirect: `${clientUrl}`, failureMessage: 'google Error' }),
);

router.post('/logout', isLoggiedIn, async (req, res) => {
    try {
        req.logOut((err) => {
            console.log(err);
        });
        req.session.destroy((err) => {
            return res.send('로그아웃 완료');
        });
    } catch (err) {
        console.log('err2', err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.get('/:email', async (req, res, next) => {
    try {
        console.log(req.params.email);
        const findUser = await User.findOne({
            where: {
                email: req.params.email,
            },
        });

        if (findUser) {
            const newUser = findUser.toJSON() as User;
            delete newUser.password;
            return res.json(newUser);
        }
        return res.status(401).send('서버에 등록된 정보가 없습니다.');
    } catch (err) {
        console.log('err', err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/change/password', async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        await User.update(
            {
                password: hashedPassword,
            },
            {
                where: { userId: req.body.userId },
            },
        );
        return res.send('변경완료');
    } catch (err) {
        console.log('err', err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.patch('/update', isLoggiedIn, upload.single('file'), async (req, res, next) => {
    try {
        const userInfo = req.body;

        const imgPath = req?.file?.originalname ? `${userInfo.userId}/${req.file.originalname}` : userInfo.profileImg;
        const returnData = await User.update(
            {
                email: userInfo.email,
                imgPath,
            },
            {
                returning: true,
                where: {
                    userId: userInfo.userId,
                },
            },
        );

        const newUser = returnData[1][0].toJSON() as User;
        delete newUser.password;
        return res.json(newUser);
    } catch (err) {
        console.log('err', err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.delete('/:userId', isLoggiedIn, async (req, res, next) => {
    try {
        await User.destroy({
            where: {
                userId: req.params.userId,
            },
        });
        req.logOut((err) => {
            console.log(err);
        });
        req.session.destroy((err) => {
            return res.send('로그아웃 완료');
        });
    } catch (err) {
        console.log('err', err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

export default router;
