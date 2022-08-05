import * as passport from 'passport';
import User from '../models/user';
import local from './local';

export default () => {
    passport.serializeUser((user, done) => {
        done(null, user.userId);
    });

    passport.deserializeUser<number>(async (userId, done) => {
        try {
            const user = await User.findOne({
                where: { userId },
            });
            if (!user) {
                return done(new Error('no user'));
            }
            return done(null, user); // req.user
        } catch (err) {
            console.error(err);
            return done(err);
        }
    });

    local();
};
