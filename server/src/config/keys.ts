import path from 'path'

// let res = dotenv.config({ path: "../.env" })
export default {
  localMongoURI:
    `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@mongo:27017/${process.env.MONGO_DB}`,
  secretOrKey:
    process.env.ACCESS_TOKEN_SECRET,
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET,
  agendaMongoURI:
    `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@mongo:27017/${process.env.MONGO_DB}`
}
