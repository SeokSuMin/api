import * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as passport from 'passport';
import { isLoggiedIn, isNotLoggedIn } from './middleware';
import * as iconv from 'iconv-lite';
import Blog from '../models/blog';
import db from '../models/sequelize';
import { sequelize } from '../models/sequelize';
import BoardFile from '../models/file';
const { QueryTypes } = db;

const router = express.Router();

const upload = multer({
    // 파일 저장
    storage: multer.diskStorage({
        destination(req, file, done) {
            // 파일 저장 경로설정
            const boardId = req.body.boardId;
            if (!fs.existsSync(`uploads/${boardId}`)) {
                fs.mkdirSync(`uploads/${boardId}`);
            }
            done(null, `uploads/${boardId}`);
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext);
            done(null, baseName + ext);
        },
    }),
});

router.get<{ offset: number; limit: number }>('/:offset/:limit', async (req, res, next) => {
    try {
        const boardList = await Blog.findAll({
            include: [
                {
                    model: BoardFile,
                    as: 'boardFiles',
                },
            ],
            order: [['createdAt', 'desc']],
            offset: req.params.offset,
            limit: req.params.limit,
        });

        const totalCount = await Blog.count();
        return res.json({ boardList, totalCount });
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.get('/categori', async (req, res, next) => {
    try {
        const querystring = `
            select 
                B.menu_categori,
                array_agg(B.catogori) as categoris
            from (
                select 
                    A.menu_categori ,
                    json_build_object(A.categori, count(A.categori)) as catogori
                from 
                    blog A
                group by a.menu_categori, a.categori
            ) B
            group by B.menu_categori
            order by B.menu_categori
        `;
        const categoriMenus = await sequelize.query(querystring, {
            type: QueryTypes.SELECT,
        });

        return res.json({ categoriMenus });
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/insert', isLoggiedIn, async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const boardData = req.body.boardData;
        const fileNames = req.body.fileNames;

        await Blog.upsert(
            {
                board_id: boardData.board_id,
                title: boardData.title,
                content: boardData.content,
                menu_categori: boardData.menu_categori,
                categori: boardData.categori,
                writer: 'shark',
            },
            {
                fields: ['title', 'content', 'menu_categori', 'categori', 'writer'],
                transaction: t,
            },
        );

        await BoardFile.bulkCreate(fileNames, {
            updateOnDuplicate: ['board_id', 'name'],
            transaction: t,
        });

        await t.commit();
        return res.send('ok');
    } catch (err) {
        console.log('err', err);
        t.rollback();
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/uploadBoardFile', isLoggiedIn, upload.single('file'), async (req, res, next) => {
    try {
        return res.send('업로드 완료');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

export default router;
