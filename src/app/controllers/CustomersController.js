import { Op } from 'sequelize';
import { parseISO } from 'date-fns';
import * as Yup from 'yup';

import Customer from '../models/Customer';
import Contact from '../models/Contact';

class CustomersController {
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

        const data = await Customer.findAll({
            where,
            include: [
                {
                    model: Contact,
                    attributes: ['id', 'status'],
                },
            ],
            order,
            limit,
            offset: limit * page - limit,
        });

        return res.json(data);
    }

    async findOne(req, res) {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json();
        }

        return res.json(customer);
    }

    async create(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string().email().required(),
            status: Yup.string().uppercase(),
        });

        try {
            const validatedData = await schema.validate(req.body, {
                abortEarly: false,
            });

            const newCustomer = await Customer.create(validatedData);

            return res.status(201).json(newCustomer);
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
        });

        try {
            const validatedData = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });

            const customer = await Customer.findByPk(req.params.id);

            if (!customer) {
                return res.status(404).json();
            }

            await customer.update(validatedData);

            return res.status(200).json(customer);
        } catch (err) {
            return res.status(400).json({
                error: 'Error on validate schema.',
                messages: err.errors,
            });
        }
    }

    async delete(req, res) {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json();
        }

        await customer.destroy();

        return res.json();
    }
}

export default new CustomersController();
