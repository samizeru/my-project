const sql = require("mssql");
const boom = require("boom");

const config = {
    user: '0',
    password: '',
    server: '', // You can use 'localhost\\instance' to connect to named instance
    database: '',

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
}

// const  executeQuery = async function( query){ 
// 	try{            
// 	let pool = await sql.connect(config)
// 	let result1 = await pool.request()
// 	.input('input_parameter', sql.Int, 10)
// 	.query(`${query}`)
// 	sql.close();
// 	// console.dir(query)   
// 	// res.send(result1.recordsets[0]); 
// 	return result1.recordsets[0]; 
// 	}catch(err){
// 		sql.close();
// 		return boom.badImplementation(err);
// 		// boom.BadImplementation(err);
// 	}      
// }

// module.exports = {executeQuery};


const pool = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(`Connected to MSSQL @ ${config.server}`)
    return pool
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err))

module.exports = {
  sql, pool
}