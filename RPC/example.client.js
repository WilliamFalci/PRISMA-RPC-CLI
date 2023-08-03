
'use strict';
const jayson = require('jayson');

// create a client
const client = new jayson.client.tcp({
  port: 3333
});

// invoke "ping"
client.request('users.get_user_by_twitch_channel_id', {twitch_channel_id: '22892195'}, function(err, response) {
  if(err) throw err;
  console.log(response);
});