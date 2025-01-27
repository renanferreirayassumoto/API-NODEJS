import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';

export default (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token not provided' });
    }

    const [_, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, authConfig.secret);

        req.userId = decoded.id;
    } catch (error) {
        return res.status(401).json({ error: 'Token invalid' });
    }

    return next();
};
