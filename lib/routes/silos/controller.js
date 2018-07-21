const boom = require('boom');
const { pool, sql } = require('../../../sql');

silosCtl={
    silo,
    silos,
    siloss
}

module.exports = silosCtl;

function silos(request,h) {
            const query = ` select * from devices `;
            // const qry = sql.executeQuery (query);
            // return qry;
            // ;

            return pool.then(conn => {
                const ps = new sql.PreparedStatement(conn)
                ps.input('xxxx', sql.VarChar)

                return ps.prepare(query)
                  .then(data => ps.execute({xxxx:'xxxx'}))
            })
            .catch(err=>{
                console.log('Error',err);
            })


       }

async function silo(request,h) {
        try{
            const p = await pool;
            let result1 = await p.request()
            .input('id', sql.Int, request.params.id)
            .query('select @id xx,* from devices where device_id = @id')
            return h.json(result1);
        }catch(err){
            console.log(err);
        }
//             const query = ` select @a  id,* from devices `;
// console.log('request', request.params.id)
//             return pool.then(conn => {
//                 const ps = new sql.PreparedStatement(conn)
//                 ps.input('a', sql.Int)

//                 return ps.query(query)
//                   .then(data => ps.execute({a: request.param.id})).then(d=>d.recordsets[0]);
//             })
//             .catch(err=>{
//                 console.log('Error',err);
//                 return boom.badImplementation('bad imple', err);
//             })

       }

function siloss(request,h) {
            const query = ` select top 1 * from devices `;
            const noneAdminUser = '';


            return pool.then(conn => {
                const ps = new sql.PreparedStatement(conn)
                ps.input('a', sql.VarChar)

                return ps.prepare(`

                        DECLARE @dst BIGINT = 0

                        IF NOT EXISTS(
                                        SELECT *
                                        FROM dst
                                        WHERE getDate() BETWEEN dst.bgn_dte AND dst.end_dte
                                    )
                                    BEGIN 
                                        SET @dst = -1
                                    END

                        --SELECT *
                        --FROM(
                            SELECT  d.name device_name
                                    , d.dia_name device_dia_name
                                    , d.*
                                    , shapes.decode shape_label
                                    , linear.decode linear_label
                                    , volume.decode volume_label
                                    , weight.decode weight_label
                                    , density.decode density_label                      
                                    , display.decode default_display_label
                                    , alarmdisplay.decode alarm_display
                                    , dist.*
                                    , CASE WHEN
                                        dateDiff( hour, (dateAdd(ss,dist.timestamp/1000,'1970-01-01')) , getDate())  BETWEEN 0 AND 25
                                        THEN
                                            'online'
                                        ELSE
                                            'offline'
                                        END onlineStatus
                                    , smu.smu_status
                                    , smu.smu_value
                                    , smu.smu_timeStamp
                                    , channelType.decode deviceType
                                    , channelType.code device_type_code
                                    , g.name gateway_name
                                    , l.name location_name
                                    , l.latitude
                                    , l.longitude
                                    , l.timezone + @dst timeZone
                                    , gr.name company_name
                                    , COUNT(*) OVER() total_record
                                    /*, d.strapping_type*/
                                    , isNULL(g.isOnline,0) isOnline
                                    /*, d.dead_zone*/
                                    , comm.comm_error
                                    , comm.comm_TimeStamp
                                    , ss.signal_strength
                                    , CASE 
                                        WHEN convert(float,distance) BETWEEN isNull(ll,height) AND height THEN 'll'
                                        WHEN convert(float,distance) BETWEEN isNull(l,height) AND isNull(ll,height) THEN 'l'
                                        WHEN convert(float,distance) BETWEEN isNull(hh,0) AND isNull(h,0) THEN 'h'
                                        WHEN convert(float,distance) BETWEEN 0 AND isNull(hh,0) THEN 'hh'
                                        ELSE 'Normal'
                                    END distance_alarm
                                    , ROW_NUMBER() OVER(ORDER BY d.name asc) as rowNum
                            FROM devices d(NOLOCK)
                            INNER JOIN gateways g(NOLOCK) ON d.gateway_id = g.gateway_id
                            INNER JOIN locations l(NOLOCK) ON g.location_id = l.location_id
                            INNER JOIN groups gr(NOLOCK) ON l.group_id = gr.group_id
                            LEFT JOIN codes display ON d.default_display = display.code AND display.type = 'display prefs'
                            LEFT JOIN codes alarmdisplay ON d.alarm_uom = alarmdisplay.code AND alarmdisplay.type = 'alarm uom'
                            LEFT JOIN codes shapes ON d.shape = shapes.code AND shapes.type = 'shapes'
                            LEFT JOIN codes linear ON d.linear_uom = linear.code AND linear.type = 'linear_uom_label'
                            LEFT JOIN codes volume ON d.volume_uom = volume.code AND volume.type = 'uom volume'
                            LEFT JOIN codes weight ON d.weight_uom = weight.code AND weight.type = 'uom weight'
                            LEFT JOIN codes density ON d.density_uom = density.code AND density.type = 'uom density'
                            LEFT JOIN codes channelType ON d.type = channelType.code AND channelType.type = 'channeltype'
                            INNER JOIN(
                                            SELECT dc.latestData distance, dc.device_id distance_device_id, dc.deviceTimestamp timestamp, c.channelType,r.*,a.alarmType distanceAlarmType,a.startDate distanceAlarmStartTime
                                            FROM DeviceChannels dc(NOLOCK)
                                            INNER JOIN Channels c(NOLOCK)  ON dc.channel_id = c.id
                                            /*if a silo changed from smu to flexar or vice versa, assume the device which ever has the latest distance data*/
                                            INNER JOIN (
                                                            SELECT max(dc.deviceTimestamp) deviceTimestamp, dc.device_id
                                                            FROM DeviceChannels dc(NOLOCK)
                                                            INNER JOIN Channels c(NOLOCK)  ON dc.channel_id = c.id
                                                            WHERE c.dia_name in ('distance', 'levelDistance')
                                                            GROUP BY dc.device_ID
                                                        ) temp ON isNull(dc.deviceTimestamp,0) = isNull(temp.deviceTimestamp,0) AND temp.device_ID = dc.device_id
                                            /*LEFT JOIN alarmNew a on dc.id = a.device_channel_id and a.endDate is NULL*/
                                            LEFT JOIN(
                                                SELECT a.*
                                                FROM AlarmNew a
                                                INNER JOIN rules r ON a.device_channel_id = r.deviceChannel_id AND a.alarmType = r.type AND r.threshold IS NOT NULL
                                            )a ON dc.id = a.device_channel_id AND a.endDate is NULL AND a.active = 1
                                            LEFT JOIN(
                                                     SELECT threshold.devicechannel_id,threshold.ll,threshold.l,threshold.h,threshold.hh
                                                            ,deadband.ll deadband_ll,deadband.l deadband_l,deadband.h deadband_h,deadband.hh deadband_hh
                                                            ,delay.ll delay_ll,delay.l delay_l,delay.h delay_h,delay.hh delay_hh
                                                            ,msg.ll msg_ll,msg.l msg_l,msg.h msg_h,msg.hh msg_hh
                                                     FROM (
                                                                SELECT devicechannel_id,type,threshold
                                                                FROM rules (NOLOCK)
                                                          ) x pivot (sum(threshold) for type IN (L,LL,H,HH)) threshold
                                                    INNER JOIN  (
                                                                    SELECT devicechannel_id,type,deadband
                                                                    FROM rules (NOLOCK)
                                                              ) x pivot (sum(deadband) for type IN (L,LL,H,HH)) deadband on threshold.deviceChannel_id = deadband.deviceChannel_id
                                                    INNER JOIN  (
                                                                    SELECT devicechannel_id,type,delay
                                                                    FROM rules (NOLOCK)
                                                              ) x pivot (sum(delay) for type IN (L,LL,H,HH)) delay on threshold.deviceChannel_id = delay.deviceChannel_id
                                                    INNER JOIN  (
                                                                    SELECT devicechannel_id,type,msg
                                                                    FROM rules (NOLOCK)
                                                              ) x pivot (max(msg) for type IN (L,LL,H,HH)) msg on threshold.deviceChannel_id = msg.deviceChannel_id

                                                    ) r ON dc.id = r.devicechannel_id
                                            WHERE c.dia_name in ('distance', 'levelDistance')
                                      ) dist on d.device_id = dist.distance_device_id
                            LEFT JOIN(
                                        SELECT DISTINCT dc.device_ID,a.alarmType smu_status,dc.latestdata smu_value, dc.deviceTimestamp smu_TimeStamp
                                        FROM DeviceChannels dc
                                        INNER JOIN Channels c on dc.channel_id = c.id
                                        /*LEFT  JOIN phrases p on 'plumb_bob_status_' + dc.latestdata = p.mnemonic*/
                                        LEFT JOIN(
                                                SELECT a.alarmType,a.device_channel_id
                                                FROM AlarmNew a
                                                INNER JOIN rules r ON a.device_channel_id = r.deviceChannel_id 
                                                AND len(a.alarmType) > 0 
                                                AND a.endDate is NULL AND a.active = 1
                                            )a ON dc.id = a.device_channel_id 
                                        WHERE c.dia_name = 'status'
                                        AND c.channelType in ('smu344n','rr')
                                    ) smu on d.device_id = smu.device_id
                            LEFT JOIN(
                                        SELECT DISTINCT dc.device_ID,dc.latestdata comm_error, dc.deviceTimestamp comm_TimeStamp
                                        FROM DeviceChannels dc
                                        INNER JOIN Channels c on dc.channel_id = c.id
                                        WHERE c.dia_name = 'comm_error'
                                    ) comm on d.device_id = comm.device_id
                            LEFT JOIN(
                                        SELECT DISTINCT dc.device_ID,dc.latestdata signal_strength
                                        FROM DeviceChannels dc
                                        INNER JOIN Channels c on dc.channel_id = c.id
                                        WHERE c.dia_name = 'signal_strength'
                                    ) ss on d.device_id = ss.device_id
                            ${noneAdminUser}
                        
                            WHERE d.status_cde = 'A' 
                            AND g.status_cde = 'A'
                            AND l.status_cde = 'A'

                    `)
                  .then(data => ps.execute({xxxx:'xxxx'}))
            })
            .catch(err=>{
                console.log('Error',err);
            })

       }

