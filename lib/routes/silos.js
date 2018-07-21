// lib/routes/random-quotation.js
'use strict';
const req = require('require-dir');
const { pool, sql } = require('../../sql');
// const sil = require('./silos/_silos');
const sil = req('./silos').controller;

module.exports = [{
    method: 'get',
    path: '/siloss',
    options: {
    	handler: sil.siloss
    },
    
},
 {
    method: 'get',
    path: '/silo/{id}',
    options: {
    	handler: sil.silo,
    	description: 'Silo by id'
	}
    
},
 {
    method: 'get',
    path: '/silos',
    options: {
    handler: sil.silos
	}
    
}
];