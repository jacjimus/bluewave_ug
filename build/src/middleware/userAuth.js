//importing modules
const jwt = require('jsonwebtoken');
//only admin middleware
function isBluewave(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            //console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.partner_id == 1 && user.role === 'superadmin') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isAirtel(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            //console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.partner_id === 2 && user.role === 'superadmin') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isVodacom(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            // console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.partner_id == 3 && user.role === 'superadmin') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isAAR(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            //console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.partner_id == 4 && user.role === 'superadmin') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                req.role = user.role === 'superadmin' ? 11 : 0;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            //console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'user') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
// isUserOrAdmin
function isUserOrAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            // console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'user' || user.role === 'admin') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isManager(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            // console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'manager') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isSuperAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            //console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'superadmin') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
//isUserOrAdminOrManager
function isUserOrAdminOrManager(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            // console.log("USER: ",user)
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'user' || user.role === 'admin' || user.role === 'manager') {
                req.user_id = user.user_id;
                req.partner_id = user.partner_id;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
//exporting module
module.exports = {
    isBluewave,
    isAirtel,
    isVodacom,
    isUser,
    isManager,
    isSuperAdmin,
    isUserOrAdmin,
    isUserOrAdminOrManager
};
