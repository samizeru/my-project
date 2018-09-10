'use strict';
const boom = require('boom');
const { pool, sql } = require('../../../sql');

histCtl={
    queueHistory
}

module.exports = histCtl;

function queueHistory(request,h) {
	try{
        const p = await pool;
        let result1 = await p.request()
        .input('id', sql.Int, request.params.id)
        .query('select @id xx,* from devices where device_id = @id')
        return h.result1;
    }catch(err){
        console.log(err);
    }
}


