export const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];

        const dataLocations = ['body', 'params', 'query', 'headers'];

        dataLocations.forEach((location) => {
            if (schema[location]) {
                const { error } = schema[location].validate(req[location], {
                    abortEarly: false,
                });

                if (error) {
                    error.details.forEach((err) => {
                        validationErrors.push({
                            message: err.message,
                            path: err.path[0],
                            location: location
                        });
                    });
                }
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Validation Error",
                errors: validationErrors
            });
        }

        next();
    };
};