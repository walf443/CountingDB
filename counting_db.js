
var CountingDB = function()
{
    "use strict";

    var net = require('net');
    var server = net.createServer(function(c) {
        console.log('server connected');
        c.on('end', function() {
            console.log('server disconnected');
        });

        c.on('data', function(data) {
            var cmd = data.toString().split(/\s+/);
            cmd.pop();
            switch ( cmd[0] ) {
                case "ping" : {
                    c.write("PONG\r\n");
                    break;
                }
                case "add_keys": {
                    if ( cmd.length < 2 ) {
                        c.write("ERROR\r\n");
                    } else {
                        c.write("OK\r\n");
                    }
                    break;
                }
                case "delete_keys": {
                    if ( cmd.length < 2 ) {
                        c.write("ERROR\r\n");
                    } else {
                        c.write("OK\r\n");
                    }
                    break;
                }
                default: {
                    c.write("ERROR\r\n");
                    break;
                }
            }
        });
    });

    server.listen(26006, function() {
        console.log('starting server');
    });
}();
