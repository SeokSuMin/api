import * as express from 'express';
import * as bcrypt from 'bcrypt';
import User from '../models/user';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as passport from 'passport';

const router = express.Router();

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

router.post('/check', async (req, res, next) => {
    try {
        const exUser = await User.findOne({
            where: {
                userId: req.body.userId,
            },
        });
        if (exUser) {
            return res.status(403).send('이미 사용중인 아이디 입니다');
        }
        res.status(200).send('ok!');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/profileUpload', upload.single('file'), async (req, res, next) => {
    try {
        const userInfo = req.body;
        const hashedPassword = await bcrypt.hash(userInfo.password, 12);
        const filePath = req?.file?.originalname ? `uploads/${userInfo.userId}/${req.file.originalname}` : '';
        await User.create({
            userId: userInfo.userId,
            password: hashedPassword,
            imgPath: filePath,
        });

        res.send('가입완료');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err: Error, user: User, info: { message: string }) => {
        if (err) {
            console.error(err);
            return next(err);
        }
        if (info) {
            return res.status(403).end(info.message);
        }
        return req.login(user, async (loginErr: Error) => {
            try {
                if (loginErr) {
                    return next(loginErr);
                } else {
                    delete user.password;
                    return res.json(user);
                }
            } catch (error) {
                console.error(error);
                return next(error);
            }
        });
    })(req, res, next);
});

export default router;
