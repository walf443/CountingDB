
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
            switch ( cmd[0] ) {
                case "ping" : {
                    c.write("PONG\r\n");
                    break;
                }
                case "add_keys": {
                    c.write("OK\r\n");
                    break;
                }
                case "delete_keys": {
                    c.write("OK\r\n");
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
