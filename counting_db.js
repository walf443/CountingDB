
var CountingDB = function()
{
    "use strict";

    var net = require('net');
    var db = {
    };

    var server = net.createServer(function(c) {
        console.log('server connected');
        c.on('end', function() {
            console.log('server disconnected');
        });

        c.on('data', function(data) {
            var cmd = data.toString().split(/\s+/);
            cmd.pop();
            var command = cmd.shift();
            switch ( command ) {
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
                case "count": {
                    if ( cmd < 3 ) {
                        c.write("ERROR\r\n");
                    } else {
                        var value = cmd.shift();
                        var keys = cmd;
                        for (var i=0; i < keys.length; i++ ) {
                            var key = keys[i];
                            if ( !db[key] ) {
                                db[key] = {
                                    "set_count": 0,
                                };
                            }
                            db[key]["set_count"]++;
                        }
                        c.write("OK\r\n");
                    }
                    break;
                }
                case "get": {
                    if ( cmd < 3 ) {
                        c.write("ERROR\r\n");
                    } else {
                        var property = cmd.shift();
                        var keys = cmd;
                        for (var i=0; i < keys.length; i++ ) {
                            var key = keys[i];
                            if ( db[key] ) {
                                c.write(["VALUE", key, db[key][property]].join(" ") + "\r\n");
                            }
                        }
                        c.write("END\r\n");
                        break;
                    }
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
