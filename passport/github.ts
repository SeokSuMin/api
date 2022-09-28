import * as passport from 'passport';
import * as GithubStrategy from 'passport-github';
import { Error } from 'sequelize/types';
import User from '../models/user';
import * as dotenv from 'dotenv';
dotenv.config();

const serverUrl =
    process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_SERVER_URL : process.env.DEVELOPMENT_SERVER_URL;

export default () => {
    passport.use(
        new GithubStrategy.Strategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID as string,
                clientSecret: process.env.GITHUB_CLIENT_SECRETS as string,
                callbackURL: `${process.env.PRODUCTION_SERVER_URL}/api/user/github/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const { id, photos, username, profileUrl } = profile;
                    const user = await User.findOne({
                        where: {
                            userId: id + '_' + username,
                            strategyType: 'git',
                        },
                    });
                    if (!user) {
                        const newUser = await User.create({
                            userId: id + '_' + username,
                            strategyType: 'git',
                            email: profileUrl,
                            imgPath: photos ? photos[0].value : '',
                            password: '',
                        });
                        return done(null, newUser);
                    }
                    return done(null, user);
                } catch (err: any) {
                    console.error(err);
                    return done(err);
                }
            },
        ),
    );
};
