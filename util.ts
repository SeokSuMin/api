import Blog from './models/blog';
import User from './models/user';
import * as fs from 'fs';

const deleteFolder = async () => {
    console.log('삭제시작');
    const boardIdList = await Blog.findAll({
        attributes: ['board_id'],
    });
    const userIdList = await User.findAll({
        where: {
            strategyType: 'local',
        },
        attributes: ['userId'],
    });

    const idList = [...boardIdList.map((v) => v.board_id), ...userIdList.map((v) => v.userId)];

    fs.readdir('uploads', (err, files) => {
        if (err) {
            console.log(err.message);
            return;
        }
        const filterIdList = files.filter((folder) => !idList.includes(folder));
        for (const forderId of filterIdList) {
            fs.rm(`uploads/${forderId}`, { recursive: true, force: true }, (err) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log(`File deleted successfully --> ${forderId}`);
            });
        }
    });
    console.log('삭제종료');
};

export { deleteFolder };
