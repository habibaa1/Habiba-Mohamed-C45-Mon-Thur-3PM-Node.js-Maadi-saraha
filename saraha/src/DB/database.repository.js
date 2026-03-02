export const findOne = async ({
    model,
    filter = {},
    select = '',
    options = {}
} = {}) => {
    const query = model.findOne(filter).select(select);
    
    if (options.populate) query.populate(options.populate);
    if (options.lean) query.lean();
    if (options.sort) query.sort(options.sort); 

    return await query.exec();
};

export const create = async ({
    model,
    data = [], 
    options = {}
} = {}) => {
    return await model.create(data, options); 
};

export const createOne = async ({
    model,
    data = {},
    options = {}
} = {}) => {
    const [doc] = await model.create([data], options);
    return doc;
};