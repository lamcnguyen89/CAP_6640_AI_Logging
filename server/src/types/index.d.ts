/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line no-unused-vars
declare namespace Express {
  // tslint:disable-next-line:no-empty-interface
  export interface IUser extends Express.User {
    id: string
    firstName: string
    lastName: string
    email: string
    password: string
    date: Date
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export interface Request {
    // eslint-disable-next-line camelcase
    serverConfig?: { db: any; mongoose: any }
    authInfo?: {}
    user?: IUser
  }
}
