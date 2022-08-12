import * as passport from 'passport';
import * as GithubStrategy from 'passport-github';
import { Error } from 'sequelize/types';
import User from '../models/user';

export default () => {
    passport.use(
        new GithubStrategy.Strategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID as string,
                clientSecret: process.env.GITHUB_CLIENT_SECRETS as string,
                callbackURL: 'http://localhost:3005/api/user/github/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                console.log('profile!!', profile);

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
