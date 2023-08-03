const path = require('path'); 
require('dotenv').config({ path: path.resolve(__dirname, '../../../CLI/env/.env') }); // SUPPORT .ENV FILES 
const processCWD = process.cwd() 
process.chdir(process.env.SERVICES_PATH + '/users/model'); 
const { PrismaClient } = require(process.env.SERVICES_PATH + '/users/interface') 
const interface = new PrismaClient()
process.chdir(processCWD) 
const CronJob = require('cron').CronJob; 
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone 
const { execSync } = require("child_process");

let runninTaskStatus = { 
	getTwitchStreamersSchedule: false 
} 

module.exports = { 
    getTwitchStreamersSchedule: new CronJob('* * * * *', async () => {
        if(!runninTaskStatus.getTwitchStreamersSchedule){
            runninTaskStatus.getTwitchStreamersSchedule = true

            let channelIDS

            try{
                channelIDS = await interface.user.findMany({
                    where: {
                        is_streamer: true
                    },
                    include: {
                        settings: true
                    }
                })


                channelIDS = channelIDS.filter( x => x.settings ).map( x => x.settings[0].twitch_channel_id)
        
                console.log(channelIDS)
                
            }catch(e){
                console.log(e)
            }

            for(const channelID of channelIDS){
                console.log(channelID)
                const schedule = execSync(`twitch api get /schedule -q broadcaster_id=${channelID}`)
                if (Object.keys(JSON.parse(schedule).data).length > 0) {
                    
                    for(const live of JSON.parse(schedule).data.segments){
                        await interface.twitch_stream_schedule.upsert({
                            update: {
                                id: live.id,
                                twitch_channel_id: channelID,
                                start_time: live.start_time,
                                end_time: live.end_time || undefined,
                                title: live.title,
                                category: live.category?.title || undefined
                            },
                            where: {
                                id: live.id,
                            },
                            create: {
                                id: live.id,
                                twitch_channel_id: channelID,
                                start_time: live.start_time,
                                end_time: live.end_time || undefined,
                                title: live.title,
                                category: live.category?.title || undefined
                            },
                        })
                    }
                }
            }

            runninTaskStatus.getTwitchStreamersSchedule = false
        }
    },null, true, TZ)
}