import * as passport from 'passport';
import * as GoogleStrategy from 'passport-google-oauth20';
import User from '../models/user';
import * as dotenv from 'dotenv';
dotenv.config();

const serverUrl =
    process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_SERVER_URL : process.env.DEVELOPMENT_SERVER_URL;

export default () => {
    passport.use(
        new GoogleStrategy.Strategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRETS as string,
                callbackURL: `${process.env.PRODUCTION_SERVER_URL}/api/user/google/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                const { sub: id, name, picture, email } = profile._json;
                try {
                    const exUser = await User.findOne({
                        where: { userId: id + '_' + (name ? name : ''), strategyType: 'google' },
                    });
                    if (exUser) {
                        done(null, exUser); // 로그인 인증 완료
                    } else {
                        const newUser = await User.create({
                            userId: id + '_' + (name ? name : ''),
                            strategyType: 'google',
                            email: email ? email : '',
                            imgPath: picture ? picture : '',
                            password: '',
                        });
                        done(null, newUser);
                    }
                } catch (error: any) {
                    console.error(error);
                    done(error);
                }
            },
        ),
    );
};
