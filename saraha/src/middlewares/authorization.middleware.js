export const authorization = (accessRoles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Please login first" });
            }

            if (!accessRoles.includes(req.user.role)) {
                return res.status(403).json({ message: "You are not authorized" });
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: "Authorization Error", error: error.message });
        }
    };
};