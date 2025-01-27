import { Sequelize } from 'sequelize';

import config from '../config/database';

import Contact from '../app/models/Contact';
import Customer from '../app/models/Customer';
import User from '../app/models/User';
import File from '../app/models/File';

const models = [Contact, Customer, User, File];

class Database {
    constructor() {
        this.connection = new Sequelize(config);
        this.init();
        this.associate();
    }

    init() {
        models.forEach((model) => model.init(this.connection));
    }

    associate() {
        models.forEach((model) => {
            if (model.associate) {
                model.associate(this.connection.models);
            }
        });
    }
}

export default new Database();
