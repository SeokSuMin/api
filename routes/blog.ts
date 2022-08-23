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
import Categori from '../models/Categori';
import BoardComment from '../models/comment';
import User from '../models/user';
import { getCategoriMenus, getComments, getDdetailBoardInfo, getPrevNextBoardId } from '../query';
const { QueryTypes, Op } = db;

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

router.get<{ offset: number; limit: number; categoriId: number }>('/:offset/:limit/:categoriId', async (req, res, next) => {
    try {
        const whereObj = {} as any;
        if (+req.params.categoriId !== 0) {
            whereObj.where = {
                categori_id: +req.params.categoriId,
            };
        }
        const boardList = await Blog.findAll({
            ...whereObj,
            include: [
                {
                    model: BoardFile,
                    as: 'boardFiles',
                },
                {
                    model: Categori,
                    as: 'categoris',
                    attributes: ['categori_name'],
                },
                {
                    model: BoardComment,
                    as: 'comments',
                },
            ],
            order: [
                ['createdAt', 'desc'],
                ['board_id', 'asc'],
                [{ model: BoardFile, as: 'boardFiles' }, 'file_id', 'asc'],
            ],
            offset: req.params.offset,
            limit: req.params.limit,
        });

        const totalCount = await Blog.count({ ...whereObj });

        console.log(boardList);

        return res.json({ boardList, totalCount });
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.get('/categori', async (req, res, next) => {
    try {
        const categoriMenus = await sequelize.query(getCategoriMenus(), {
            type: QueryTypes.SELECT,
        });

        const totalCount = await Blog.count();

        return res.json({ categoriMenus, totalCount });
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
                categori_id: boardData.categori_id,
                title: boardData.title,
                content: boardData.content,
                writer: 'shark',
            },
            {
                fields: ['title', 'categori_id', 'content', 'writer'],
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

router.get<{ boardId: string; categoriId: number }>('/:boardId/:categoriId', async (req, res, next) => {
    try {
        const boardInfo = await sequelize.query(getDdetailBoardInfo(), {
            replacements: {
                boardId: req.params.boardId,
            },
            type: QueryTypes.SELECT,
        });
        const categoriWhere = +req.params.categoriId === 0 ? '' : `where categori_id = :categoriId`;
        const prevNextBoardIds = await sequelize.query(getPrevNextBoardId(categoriWhere), {
            replacements: {
                categoriId: req.params.categoriId,
                boardId: req.params.boardId,
            },
            type: QueryTypes.SELECT,
        });

        return res.json({ boardInfo: boardInfo[0], prevNextBoardIds });
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/insert/comment', isLoggiedIn, async (req, res, next) => {
    try {
        const commentData = req.body;

        console.log(commentData);

        await BoardComment.upsert(
            {
                comment_id: commentData.comment_id,
                board_id: commentData.board_id,
                content: commentData.content,
                modify_flag: commentData.modify_flag,
                parent_id: commentData.parent_id,
                parent_user_id: commentData.parent_user_id,
                user_id: commentData.user_id,
            },
            {
                fields: ['board_id', 'content', 'modify_flag', 'parent_id', 'parent_user_id', 'user_id'],
            },
        );

        const newCommentData = await sequelize.query(getComments(), {
            replacements: {
                boardId: commentData.board_id,
            },
            type: QueryTypes.SELECT,
        });

        return res.json(newCommentData[0]);
    } catch (err) {
        console.log('err', err);

        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

export default router;
