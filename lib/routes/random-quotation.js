'use strict';

module.exports = {
    method: 'get',
    path: '/tst',
    options: {
        handler: async (request, h) => {
        	console.log('query',request.query)
        	return {"tst":"ok"};
        }
    }
};
