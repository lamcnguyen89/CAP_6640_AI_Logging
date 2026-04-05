// passport.ts
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import User from '../models/User'
import UnityUserToken from '../models/UnityUserToken'
import UnityBuildToken from '../models/UnityBuildToken'
import keys from './keys'

export default (passport: any) => {

  // JWT strategy (for authentication via JWT tokens)
  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: keys.secretOrKey
  }
  passport.use(
    'jwt',
    new JwtStrategy(jwtOpts, async (payload: any, done: Function) => {
      try {
        const user = await User.findById(payload.id)
        if (user) {
          // Add the auth strategy to the user object
          (user as any).authStrategy = 'jwt'; // <-- Add this line
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false)
      }
    })
  )

  // Unity user token strategy - used for authentication via Unity, per-user, used for experiment management
  // Note - editor-only, not included in final build, and as such can not be used to record data.
  passport.use(
    'unity-user-token',
    new BearerStrategy(async (token: string, done: Function) => {
      try {
        const unity = await UnityUserToken
          .findOne({ token, revoked: false })
          .populate('user')
        if (!unity) return done(null, false)

        unity.lastUsed = new Date();
        await unity.save();

        // Add the auth strategy to the user object
        (unity.user as any).authStrategy = 'unity-user-token';
        return done(null, unity.user);
      } catch (err) {
        return done(err)
      }
    })
  )

  // Unity build token strategy - used for authentication via built experiments,
  // one per experiment, used for uploading data and related tasks
  passport.use(
    'unity-build-token',
    new BearerStrategy(async (token: string, done: Function) => {
      try {
        const unity = await UnityBuildToken
          .findOne({ token, revoked: false })
          .populate('experiment')
        if (!unity) return done(null, false)

        unity.lastUsed = new Date();
        await unity.save();

        // Add the auth strategy to the experiment object
        (unity.experiment as any).authStrategy = 'unity-build-token';
        return done(null, unity.experiment);
      } catch (err) {
        return done(err)
      }
    })
  )
}
