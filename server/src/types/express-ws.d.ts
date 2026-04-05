import * as express from 'express'
import * as expressWs from 'express-ws'

declare global {
  namespace Express {
    interface Application {
      ws: expressWs.ApplicationWithWebSocket['ws']
    }
  }
}