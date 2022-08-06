import { Request, Response, NextFunction } from 'express';

const isLoggiedIn = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).send('로그인이 필요합니다.');
    }
};

const isNotLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        res.status(401).send('이미 로그인 되어있습니다.');
    }
};

export { isLoggiedIn, isNotLoggedIn };
