import { Op } from 'sequelize';
import { parseISO } from 'date-fns';
import * as Yup from 'yup';

import User from '../models/User';

import Queue from '../../lib/Queue';
import WelcomeEmailJob from '../jobs/WelcomeEmailJob';

class UsersController {
    async findAll(req, res) {
        const {
            name,
            email,
            status,
            createdBefore,
            createdAfter,
            updatedBefore,
            updatedAfter,
            sort,
        } = req.query;

        const page = req.query.page || 1;
        const limit = req.query.limit || 25;

        let where = {};
        let order = [];

        if (name) {
            where = {
                ...where,
                name: {
                    [Op.iLike]: name,
                },
            };
        }

        if (email) {
            where = {
                ...where,
                email: {
                    [Op.iLike]: email,
                },
            };
        }

        if (status) {
            where = {
                ...where,
                status: {
                    [Op.in]: status
                        .split(',')
                        .map((item) => item.toUpperCase()),
                },
            };
        }

        if (createdBefore) {
            where = {
                ...where,
                createdAt: {
                    [Op.lte]: parseISO(createdBefore),
                },
            };
        }

        if (createdAfter) {
            where = {
                ...where,
                createdAt: {
                    [Op.gte]: parseISO(createdAfter),
                },
            };
        }

        if (updatedBefore) {
            where = {
                ...where,
                updatedAt: {
                    [Op.lte]: parseISO(updatedBefore),
                },
            };
        }

        if (updatedAfter) {
            where = {
                ...where,
                updatedAt: {
                    [Op.gte]: parseISO(updatedAfter),
                },
            };
        }

        if (sort) {
            order = sort.split(',').map((item) => item.split(':'));
        }

        const data = await User.findAll({
            where,
            order,
            limit,
            offset: limit * page - limit,
            attributes: {
                exclude: ['password_hash', 'password'],
            },
        });

        return res.json(data);
    }

    async findOne(req, res) {
        const user = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password_hash', 'password'],
            },
        });

        if (!user) {
            return res.status(404).json();
        }

        const { id, name, email, file_id, status, createdAt, updatedAt } = user;

        return res.json({
            id,
            name,
            email,
            file_id,
            status,
            createdAt,
            updatedAt,
        });
    }

    async create(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string().email().required(),
            status: Yup.string().uppercase(),
            password: Yup.string().required().min(8),
            passwordConfirmation: Yup.string().when(
                'password',
                (password, field) =>
                    password
                        ? field.required().oneOf([Yup.ref('password')])
                        : field
            ),
        });

        try {
            const validatedData = await schema.validate(req.body, {
                abortEarly: false,
            });

            const { id, name, email, file_id, createdAt, updatedAt } =
                await User.create(validatedData);

            await Queue.add(WelcomeEmailJob.key, { name, email });

            return res
                .status(201)
                .json({ id, name, email, file_id, createdAt, updatedAt });
        } catch (err) {
            return res.status(400).json({
                error: 'Error on validate schema.',
                messages: err.errors,
            });
        }
    }

    async update(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
            status: Yup.string().uppercase(),
            file_id: Yup.number().integer(),
            oldPassword: Yup.string().min(8),
            password: Yup.string()
                .min(8)
                .when('oldPassword', {
                    is: (oldPassword) => !!oldPassword,
                    then: (field) => field.required(),
                    otherwise: (field) => field.notRequired(),
                }),
            passwordConfirmation: Yup.string().when('password', {
                is: (password) => !!password,
                then: (field) =>
                    field
                        .required()
                        .oneOf([Yup.ref('password')], 'Passwords must match'),
                otherwise: (field) => field.notRequired(),
            }),
        });

        try {
            const validatedData = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });

            const user = await User.findByPk(req.params.id);

            if (!user) {
                return res.status(404).json();
            }

            const { oldPassword } = req.body;

            if (oldPassword && !(await user.checkPassword(oldPassword))) {
                return res
                    .status(401)
                    .json({ error: "User password doesn't match." });
            }

            const { id, name, email, file_id, createdAt, updatedAt } =
                await user.update(validatedData);

            return res
                .status(200)
                .json({ id, name, email, file_id, createdAt, updatedAt });
        } catch (err) {
            return res.status(400).json({
                error: 'Error on validate schema.',
                messages: err.errors,
            });
        }
    }

    async delete(req, res) {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json();
        }

        await user.destroy();

        return res.json();
    }
}

export default new UsersController();
