// lib/routes/random-quotation.js
'use strict';
const sql = require('../../sql');

const Joi = require('joi');

module.exports = {
    method: 'get',
    path: '/random-quotation',
    options: {
        handler: (request) => {
            const query = "select top 5000 * from [channelHistory]";
            const qry=    executeQuery (query);
            return qry;
        }
    },
    method: 'get',
    path: '/users/{name}',
        handler: (request) => {
            const query = `
            	select *
            	from users
            `;
            const qry =  sql.executeQuery(query);
            return qry;
    	},
    options: {
        validate: {
            params: {
                name: Joi.string().min(3).max(10)
            }
        }
    }
};