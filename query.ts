const getCategoriMenus = () => {
    const queryString = `
        select 
            a.menu_id ,
            a.menu_name ,
            a.sort ,
            array_to_json(array_agg(b order by b.sort asc)) as categoris
        from menu a left outer join (
            select 
                c.categori_id,
                c.menu_id,
                c.sort, 
                c.categori_name ,
                count(b.categori_id) as total_count
            from 
                categori c left outer join blog b 
            on
                c.categori_id = b.categori_id 
            group by
                c.categori_id, c.menu_id, c.sort, c.categori_name
            order by 
                c.menu_id, c.sort
        ) b
        on
            a.menu_id = b.menu_id
        group by 
            a.menu_id
        order by 
            a.sort 
    `;
    return queryString;
};

const getBoardList = (offset: number, limit: number, where: string, orderCol: string, addLikeCommentQuery: string) => {
    const queryString = `
        select
            a.* ,
            (select count(bc.comment_id)::integer from board_comment bc where bc.board_id = a.board_id) as comment_count,
            (select count(bl.like_id)::integer from blog_like bl where bl.board_id = a.board_id) as like_count
            ${addLikeCommentQuery}
        from (
            select 
                b.board_id ,
                b.categori_id ,
                b.title ,
                b.content ,
                b.writer ,
                b.thumb_img_name ,
                b."createdAt" ,
                array_to_json(array_agg(bf order by file_id)) as board_files
            from 
                blog b left outer join board_file bf
            on
                b.board_id = bf.board_id 	
            group by 
                b.board_id 
        ) a 
        ${where} 
        order by 
            ${orderCol}
        offset ${offset}
        limit ${limit}
    `;
    return queryString;
};

const getPrevNextBoardId = (where: string, order: string) => {
    const queryString = `
        select
            *
        from (
            select
                board_id,
                categori_id,
                lag(board_id, 1) over (order by ${order}) as next,
                lead(board_id, 1) over (order by ${order}) as prev
            from
                public.blog b
            ${where}
            ) a
        where
            a.board_id = :boardId
    `;
    return queryString;
};

const getDdetailBoardInfo = (addLikeQuery: string) => {
    const queryString = `
        with comments as (
            select 
                array_to_json(array_agg(b)) as comments
            from(
                select 
                    c1.*,
                    u."strategyType" as strategy_type ,
                    u."imgPath" as img_path ,
                    a.child_comment
                from
                    board_comment c1 
                left outer join 
                (
                    select 
                        c2.parent_id,
                        array_agg(
                            json_build_object(
                                'comment_id', c2.comment_id, 
                                'board_id',c2.board_id, 
                                'parent_id',c2.parent_id, 
                                'content',c2.content, 
                                'parent_user_id',c2.parent_user_id, 
                                'user_id',c2.user_id,
                                'modify_flag', c2.modify_flag,
                                'strategy_type', (select "strategyType" th from user_info ui where ui."userId" = c2.user_id),
                                'img_path', (select "imgPath" th from user_info ui where ui."userId" = c2.user_id),
                                'createdAt',c2."createdAt"
                            ) 
                        order by c2."createdAt" asc) as child_comment
                        from 
                            board_comment c2
                        where 
                            c2.board_id = :boardId  and
                            c2.parent_id is not null
                        group by c2.parent_id
                ) a
                on
                    c1.comment_id = a.parent_id
                join 
                    user_info u
                on 
                    c1.user_id = u."userId" 
                where
                    c1.board_id = :boardId  and
                    c1.parent_id is null
                order by c1."createdAt" asc
                ) b
            ), boardFiles as (
                select 
                    array_to_json(array_agg(board_file order by "createdAt" asc)) as board_files
                from 
                    board_file
                where 
                    board_id = :boardId 
            ) select 
                b.* ,
                json_build_object('categori_name', (select categori_name from categori c where c.categori_id = b.categori_id)) as categoris ,
                bf.board_files ,
                c.comments,
                ${addLikeQuery}
                (select count(like_id) from blog_like bl where bl.board_id = :boardId) as like_count
            from 
                blog b, comments c, boardFiles bf
            where 
                b.board_id = :boardId 
    `;
    return queryString;
};

const getComments = () => {
    const queryString = `
        select 
            array_to_json(array_agg(b)) as comments
        from(
            select 
                c1.*,
                u."strategyType" as strategy_type ,
                u."imgPath" as img_path ,
                a.child_comment
            from
                board_comment c1 
            left outer join 
            (
                select 
                    c2.parent_id,
                    array_agg(
                        json_build_object(
                            'comment_id', c2.comment_id, 
                            'board_id',c2.board_id, 
                            'parent_id',c2.parent_id, 
                            'content',c2.content, 
                            'parent_user_id',c2.parent_user_id, 
                            'user_id',c2.user_id,
                            'modify_flag', c2.modify_flag,
                            'img_path', (select "imgPath" th from user_info ui where ui."userId" = c2.user_id),
                            'strategy_type', (select "strategyType" th from user_info ui where ui."userId" = c2.user_id),
                            'createdAt',c2."createdAt"
                        ) 
                    order by c2."createdAt" asc) as child_comment
                    from 
                        board_comment c2
                    where 
                        c2.board_id = :boardId and
                        c2.parent_id is not null
                    group by c2.parent_id
            ) a
            on
                c1.comment_id = a.parent_id
            join 
                user_info u
            on 
                c1.user_id = u."userId" 
            where
                c1.board_id = :boardId and
                c1.parent_id is null
            order by c1."createdAt" asc
        ) b
        `;
    return queryString;
};

export { getCategoriMenus, getPrevNextBoardId, getDdetailBoardInfo, getComments, getBoardList };
