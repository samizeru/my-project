
const { pool, sql } = require('../sql');
const kue = require('kue');  
kue.app.listen(3000); 

const q = kue.createQueue();
q.process('Stream', (job, done)=> {  
    let a = new Device(job.data);
    // a.getDeviceID();
    a.setSystemIds();
    done();
});

q.on('job enqueue', (id, type)=>{
  // console.log( 'Job %s got queued of type %s', id, type );
}).on('job complete', (id, result)=>{
  kue.Job.get(id, (err, job)=>{
    if (err) return;
    job.remove(err=>{
      if (err) throw err;
      // console.log('removed completed job #%d', job.id);
    });
  });
});


class Device{

    constructor(obj){
        // console.log('object',obj)
        let a = obj.streamId.split('/');
        this.idigi_device_id = a[0];
        this.dia_name = a[1];
        this.channel_name = a[2]
        this.channel_type = this.dia_name.split(':')[0]
        this.sensor_address = this.dia_name.split(':')[1]
        this.data = obj.data
        this.id = obj.id
        this.timestamp = obj.timestamp;
        this.servertimestamp = obj.serverTimestamp;

    }

    async setSystemIds (){
        this.gateway_id = await this.getGatewayID();        
        this.device_id = await this.getDeviceID();
        this.channel_id = await this.getChannelID();
        this.device_channel_id = await this.getDeviceChannelID();
        this.channel_history_id = await this.channelHistory();
        // await this.getIDs().then(x=>{
        // 	this.device_id = x.device_id;
        // 	this.channel_id = x.channel_id;
        // 	this.device_channel_id = x.device_channel_id;
        // 	// console.log('this...***', this)
        // });
        console.log(this);
    }

    async getGatewayID(){
        try{
            const p = await pool;
            let result = await p.request()
            .input('idigi_device_id', sql.NVarChar, this.idigi_device_id)
            .query(`
                    Declare @gid bigint

                    SELECT gateway_id 
                    FROM gateways (NOLOCK) 
                    WHERE idigi_device_id = @idigi_device_id
                `)
            // console.log('@did', result.recordset[0]);
            return result.recordset[0].gateway_id;
        }catch(err){
            console.log(err);
        }
    }

    async getDeviceID(){
        try{
            const p = await pool;
            let result = await p.request()
            .input('dia_name', sql.NVarChar, this.dia_name)
            .input('idigi_device_id', sql.NVarChar, this.idigi_device_id)
            .query(`
                    SELECT device_id 
                    FROM devices d (NOLOCK)
                    INNER JOIN gateways g ON d.gateway_id = g.gateway_id 
                    WHERE dia_name = @dia_name
                    AND g.idigi_device_id = @idigi_device_id
                `)
            // console.log('@did', result.recordset[0]);
            return result.recordset[0].device_id;
        }catch(err){
            console.log(err);
        }
    }


    async getChannelID(){
        try{
            const p = await pool;
            let result = await p.request()
            .input('channel_name', sql.NVarChar, this.channel_name)
            .input('channel_type', sql.NVarChar, this.channel_type)
            .query(`
                    SELECT id 
                    FROM channels c(NOLOCK) 
                    WHERE name = @channel_name
                    AND c.channelType = @channel_type
                `)
            // console.log('@did', result.recordset[0]);
            return result.recordset[0].id;
        }catch(err){
            console.log(err);
        }
    }

    async getDeviceChannelID(){
        try{
            const p = await pool;
            let result = await p.request()
            .input('channel_id', sql.Int, this.channel_id)
            .input('device_id', sql.Int, this.device_id)
            .query(`
                    SELECT id 
                    FROM deviceChannels c(NOLOCK) 
                    WHERE device_id = @device_id
                    AND c.channel_id = @channel_id
                `)
            // console.log('@did', result.recordset[0]);
            return result.recordset[0].id;
        }catch(err){
            console.log(err);
        }
    }

    async getIDs(){
        try{
            const p = await pool;
            let result = await p.request()
            .input('dia_name', sql.NVarChar, this.dia_name)
            .input('channel_name', sql.NVarChar, this.channel_name)
            .input('channel_type', sql.NVarChar, this.channel_type)
            .query(`
                    Declare @did bigint
                    Declare @cid bigint
                    Declare @dcid bigint

                    SELECT @did = device_id 
                    FROM devices (NOLOCK) 
                    WHERE dia_name = @dia_name

                    SELECT @cid = id
                    FROM channels (NOLOCK)
                    WHERE name = @channel_name
                    AND channelType = @channel_type

                    SELECT @dcid = id
                    FROM deviceChannels (NOLOCK)
                    WHERE device_id = @did
                    AND channel_id = @cid

                    SELECT @did device_id, @cid channel_id, @dcid  device_channel_id--, @channel_name name
                `)
            // console.log('@did', result.recordset[0]);
            return result.recordset[0];
        }catch(err){
            console.log(err);
        }
    }


    async channelHistory(){
        try{
            const p = await pool;
            let result = await p.request()
            .input('dcid', sql.Int, this.device_channel_id)
            .query(`
            		SELECT top 1 *
            		FROM channelHistory(nolock)
            		WHERE device_channel_id = @dcid
                `)
            // console.log('@did', result.recordset[0]);
            return result.recordset[0] && result.recordset[0].id ? result.recordset[0].id : null;
        }catch(err){
            console.log(err);
        }
    }

    
}