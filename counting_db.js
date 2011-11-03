
var CountingDB = function()
{
    "use strict";

    var net = require('net');
    var db = {
    };

    var stats = {
        "cmd_count": 0,
        "cmd_get": 0,
        "current_connection": 0,
        "item_count": 0,
    };

    var server = net.createServer(function(c) {
        stats["current_connection"]++;
        c.on('end', function() {
            stats["current_connection"]--;
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
                case "stats" : {
                    var memusage = process.memoryUsage();
                    stats["rss"] = memusage["rss"];
                    stats["heap_total"] = memusage["heapTotal"];
                    stats["heap_used"] = memusage["heapUsed"];

                    for (var key in stats ) {
                        c.write("STAT " + key + " " + stats[key] + "\r\n");
                    }
                    c.write("END\r\n");
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
                        stats["cmd_count"]++;

                        var value = cmd.shift();
                        var keys = cmd;
                        for (var i=0; i < keys.length; i++ ) {
                            var key = keys[i];
                            if ( !db[key] ) {
                                db[key] = {
                                    "set_count": 0,
                                    "unique_count": {
                                        value: 0,
                                    },
                                };
                            }
                            db[key]["set_count"]++;
                            if ( db[key]["unique_count"][value] == null ) {
                                stats["item_count"]++;
                            };
                            db[key]["unique_count"][value]++;
                        }
                        c.write("OK\r\n");
                    }
                    break;
                }
                case "get": {
                    if ( cmd < 3 ) {
                        c.write("ERROR\r\n");
                    } else {
                        stats["cmd_get"]++;

                        var property = cmd.shift();
                        var keys = cmd;
                        for (var i=0; i < keys.length; i++ ) {
                            var key = keys[i];
                            if ( db[key] ) {
                                if ( property == "unique_count" ) {
                                    var unique_count = 0;
                                    for ( var j in db[key][property] ) {
                                        unique_count++;
                                    }
                                    c.write(["VALUE", key, unique_count ].join(" ") + "\r\n");
                                } else {
                                    c.write(["VALUE", key, db[key][property]].join(" ") + "\r\n");
                                }
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
