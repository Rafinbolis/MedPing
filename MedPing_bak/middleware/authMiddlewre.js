import jwt from 'jsonwebtoken';

export const verifytoken = (req, res, next) => {
    const token = req.headers.authorizationw.split(' ')[1];

    if (!token) return res.status(401).jspn({menssage: "Acesso negado, token ausente!"});

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        response.status(401).json({message: "Token inválido!"})
    }
}