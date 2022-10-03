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
import Categori from '../models/categori';
import BoardComment from '../models/comment';
import User from '../models/user';
import { getCategoriMenus, getComments, getDdetailBoardInfo, getPrevNextBoardId } from '../query';
import Menu from '../models/menu';
const { QueryTypes, Op, fn, literal } = db;

const router = express.Router();

const upload = multer({
    // 파일 저장
    storage: multer.diskStorage({
        destination(req, file, done) {
            // 파일 저장 경로설정
            // console.log(file);
            const boardId = req.body.boardId;
            if (!fs.existsSync(`uploads/${boardId}`)) {
                fs.mkdirSync(`uploads/${boardId}`);
            }
            done(null, `uploads/${boardId}`);
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            if (
                file.mimetype == 'image/png' ||
                file.mimetype == 'image/jpg' ||
                file.mimetype == 'image/jpeg' ||
                file.mimetype == 'image/webp'
            ) {
                const baseName = path.basename(file.originalname, ext) + Date.now();
                done(null, baseName + ext);
            } else {
                const baseName = path.basename(file.originalname, ext);
                done(null, baseName + ext);
            }
        },
    }),
});

router.get<{ offset: number; limit: number; categoriId: number }>(
    '/:offset/:limit/:categoriId',
    async (req, res, next) => {
        try {
            const whereObj = {} as any;
            if (+req.params.categoriId !== 0) {
                whereObj.where = {
                    categori_id: +req.params.categoriId,
                };
            }
            const boardList = await Blog.findAll({
                ...whereObj,
                attributes: [
                    'board_id',
                    'categori_id',
                    'title',
                    'content',
                    'writer',
                    'createdAt',
                    [
                        literal(
                            '(select count(bc.comment_id)::integer from board_comment bc where bc.board_id = "Blog"."board_id")',
                        ),
                        'comment_count',
                    ],
                ],
                include: [
                    {
                        model: BoardFile,
                        as: 'board_files',
                    },
                    {
                        model: Categori,
                        as: 'categoris',
                        attributes: ['categori_name'],
                    },
                    // {
                    //     model: BoardComment,
                    //     as: 'comments',
                    //     // attributes: [[fn('COUNT', 'comment_id'), 'commentCount']],
                    // },
                ],
                order: [
                    ['createdAt', 'desc'],
                    [literal('comment_count'), 'asc'],
                    [{ model: BoardFile, as: 'board_files' }, 'file_id', 'asc'],
                ],
                offset: req.params.offset,
                limit: req.params.limit,
            });

            const totalCount = await Blog.count({ ...whereObj });
            return res.json({ boardList, totalCount });
        } catch (err) {
            console.log(err);
            return res.status(500).send('서버 에러가 발생하였습니다.');
        }
    },
);

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

router.post('/board/insert', isLoggiedIn, async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const boardData = req.body.boardData;
        const fileNames = req.body.fileNames;
        const deleteFileIds = req.body.deleteFileIds;

        await Blog.upsert(
            {
                board_id: boardData.board_id,
                categori_id: boardData.categori_id,
                title: boardData.title,
                content: boardData.content,
                writer: 'iceMan',
            },
            {
                fields: ['title', 'categori_id', 'content', 'writer'],
                transaction: t,
            },
        );
        if (fileNames.length) {
            await BoardFile.bulkCreate(fileNames, {
                updateOnDuplicate: ['board_id', 'name'],
                transaction: t,
            });
        }

        if (deleteFileIds.length) {
            await BoardFile.destroy({
                where: {
                    file_id: deleteFileIds,
                },
                transaction: t,
            });
        }

        await t.commit();
        return res.send('ok');
    } catch (err) {
        console.log('err', err);
        t.rollback();
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/uploadBoardFile', isLoggiedIn, upload.array('file'), async (req, res, next) => {
    try {
        const files = req.files as Array<Express.Multer.File>;
        const fileNames = files.map((file) => file.filename);

        console.log(fileNames);

        return res.json({ fileNames });
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

        if (+req.params.categoriId !== -1) {
            const categoriWhere = +req.params.categoriId === 0 ? '' : `where categori_id = :categoriId`;
            const prevNextBoardIds = await sequelize.query(getPrevNextBoardId(categoriWhere), {
                replacements: {
                    categoriId: req.params.categoriId,
                    boardId: req.params.boardId,
                },
                type: QueryTypes.SELECT,
            });
            return res.json({ boardInfo: boardInfo[0], prevNextBoardIds });
        } else {
            return res.json({ boardInfo: boardInfo[0] });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.post('/comment/insert', isLoggiedIn, async (req, res, next) => {
    try {
        const commentData = req.body;
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

router.delete('/board/:boardId', isLoggiedIn, async (req, res, next) => {
    try {
        const boardId = req.params.boardId;
        const result = await Blog.destroy({
            where: {
                board_id: boardId,
            },
        });
        return res.send('삭제완료');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.delete('/comment/:commentId', isLoggiedIn, async (req, res, next) => {
    try {
        const commentId = req.params.commentId;
        const result = await BoardComment.destroy({
            where: {
                [Op.or]: [{ comment_id: commentId }, { parent_id: commentId }],
            },
        });
        return res.send('삭제완료');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.patch('/menu/update', isLoggiedIn, async (req, res, next) => {
    try {
        const menuDate = req.body;

        await Menu.bulkCreate(menuDate.updateData, {
            updateOnDuplicate: ['menu_id', 'menu_name', 'sort'],
        });

        if (menuDate.deleteMenuIds.length) {
            await Menu.destroy({
                where: {
                    menu_id: menuDate.deleteMenuIds,
                },
            });
        }

        const categoriMenus = await sequelize.query(getCategoriMenus(), {
            type: QueryTypes.SELECT,
        });
        const totalCount = await Blog.count();
        return res.json({ categoriMenus, totalCount });
    } catch (err) {
        console.log('err', err);

        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.patch('/categori/update', isLoggiedIn, async (req, res, next) => {
    try {
        const categoriDate = req.body;

        await Categori.bulkCreate(categoriDate.updateData, {
            updateOnDuplicate: ['categori_id', 'menu_id', 'categori_name', 'sort'],
        });

        if (categoriDate.deleteCategoriIds.length) {
            await Categori.destroy({
                where: {
                    categori_id: categoriDate.deleteCategoriIds,
                },
            });
            await Blog.destroy({
                where: {
                    categori_id: categoriDate.deleteCategoriIds,
                },
            });
        }

        const categoriMenus = await sequelize.query(getCategoriMenus(), {
            type: QueryTypes.SELECT,
        });
        const totalCount = await Blog.count();
        return res.json({ categoriMenus, totalCount });
    } catch (err) {
        console.log('err', err);

        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

export default router;
