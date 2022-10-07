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
import { getBoardList, getCategoriMenus, getComments, getDdetailBoardInfo, getPrevNextBoardId } from '../query';
import Menu from '../models/menu';
import BlogLike from '../models/blogLike';
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

router.post('/', async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const prams = req.body;
        const orderCol = `"${prams.order.split(' ')[0]}" ${prams.order.split(' ')[1]}`;
        // 사용자가 로그인 상태면 좋아요, 댓글을 표시한 글을 체크하기 위한 추가쿼리
        const addLikeCommentQuery = userId
            ? `, (select like_id from blog_like bl where bl.board_id = a.board_id and bl.user_id = :userId) as like_id
               , (select comment_id from board_comment bc where bc.board_id = a.board_id and bc.user_id = 'shark' limit 1) as comment_id
            `
            : '';
        let where = prams.categoriId !== 0 ? 'where categori_id = :categoriId' : '';

        if (prams.where.includes('like')) {
            const likeCondition =
                'a.board_id in (select bl.board_id from blog_like bl where bl.board_id = a.board_id and bl.user_id = :userId)';
            where += where ? `and ${likeCondition}` : `where ${likeCondition}`;
        }
        if (prams.where.includes('comment')) {
            const commentCondition =
                'a.board_id in (select bc.board_id from board_comment bc where bc.board_id = a.board_id and bc.user_id = :userId)';
            where += where ? `and ${commentCondition}` : `where ${commentCondition}`;
        }

        const boardList = await sequelize.query(
            getBoardList(prams.offset, prams.limit, where, orderCol, addLikeCommentQuery),
            {
                replacements: {
                    categoriId: prams.categoriId,
                    userId: userId || '',
                },
                type: QueryTypes.SELECT,
            },
        );

        const totalCount: { count: number }[] = await sequelize.query(
            `
            select 
                count(board_id)
            from
                blog 
            ${where}
        `,
            {
                replacements: {
                    categoriId: prams.categoriId,
                    userId: userId || '',
                },
                type: QueryTypes.SELECT,
            },
        );
        return res.json({ boardList, totalCount: totalCount[0].count });
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
        const user = req.user;
        const userId = user?.userId ? user?.userId : '';
        // 사용자가 로그인 상태면 좋아요 체크한 글을 체크하기 위한 추가쿼리
        const addLikeQuery = userId
            ? `(select like_id from blog_like bl where bl.board_id = :boardId and user_id = :userId) as like_id ,`
            : '';
        const boardInfo = await sequelize.query(getDdetailBoardInfo(addLikeQuery), {
            replacements: {
                boardId: req.params.boardId,
                userId,
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

router.post('/like/:boardId', isLoggiedIn, async (req, res, next) => {
    try {
        const userId = req.user?.userId as string;
        const boardId = req.params.boardId;
        await BlogLike.upsert(
            {
                like_id: null,
                board_id: boardId,
                user_id: userId,
            },
            {
                fields: ['board_id', 'user_id'],
            },
        );
        return res.status(201).send('저장성공');
    } catch (err) {
        console.log('err', err);

        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

router.delete('/like/:boardId', isLoggiedIn, async (req, res, next) => {
    try {
        const userId = req.user?.userId as string;
        const boardId = req.params.boardId;
        const result = await BlogLike.destroy({
            where: {
                board_id: boardId,
                user_id: userId,
            },
        });
        return res.send('삭제완료');
    } catch (err) {
        console.log(err);
        return res.status(500).send('서버 에러가 발생하였습니다.');
    }
});

export default router;
