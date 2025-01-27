import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer.js';

import CustomersController from './app/controllers/CustomersController.js';
import ContactsController from './app/controllers/ContactsController.js';
import UsersController from './app/controllers/UsersController.js';
import SessionsController from './app/controllers/SessionsController.js';
import FilesController from './app/controllers/FilesController.js';

import auth from './app/middlewares/auth.js';

const routes = new Router();
const upload = multer(multerConfig);

// Sessions
routes.post('/sessions', SessionsController.create);

routes.use(auth);

// Customers
routes.get('/customers', CustomersController.findAll);
routes.get('/customers/:id', CustomersController.findOne);
routes.post('/customers', CustomersController.create);
routes.put('/customers/:id', CustomersController.update);
routes.delete('/customers/:id', CustomersController.delete);

// Contacts
routes.get('/customers/:customerId/contacts', ContactsController.findAll);
routes.get('/customers/:customerId/contacts/:id', ContactsController.findOne);
routes.post('/customers/:customerId/contacts', ContactsController.create);
routes.put('/customers/:customerId/contacts/:id', ContactsController.update);
routes.delete('/customers/:customerId/contacts/:id', ContactsController.delete);

// Users
routes.get('/users', UsersController.findAll);
routes.get('/users/:id', UsersController.findOne);
routes.post('/users', UsersController.create);
routes.put('/users/:id', UsersController.update);
routes.delete('/users/:id', UsersController.delete);

// Files
routes.post('/files', upload.single('file'), FilesController.create);

export default routes;
