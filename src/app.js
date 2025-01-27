import 'dotenv/config';

import express from 'express';
import routes from './routes.js';
import 'express-async-errors';
import Youch from 'youch';
import * as Sentry from '@sentry/node';
import sentryConfig from './config/sentry.js';

import './database';
import authMiddleware from './app/middlewares/auth.js';

class App {
    constructor() {
        this.server = express();
        Sentry.init(sentryConfig);
        this.middlewares();
        this.routes();
        this.exceptionHandler();
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(authMiddleware);
    }

    routes() {
        this.server.use(routes);
    }

    exceptionHandler() {
        this.server.use(async (err, req, res, next) => {
            if (process.env.NODE_ENV === 'development') {
                const errors = await new Youch(err, req).toJSON();

                return res.status(500).json(errors);
            }

            return res.status(500).json({ error: 'Internal server error' });
        });
    }
}

export default new App().server;
