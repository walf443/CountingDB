
var CountingDB = function()
{
    "use strict";
    var DEFAULT_PORT = 26006;

    var net = require('net');

    var db = {
    };

    var stats = {
        "cmd_count": 0,
        "cmd_get": 0,
        "current_connection": 0,
        "item_count": 0,
        "pid": process.pid,
        "uptime": 0,
    };

    // FIXME: I don't like to hook process event not as possible.
    process.on('exit', function() {
        console.log('server terminate.');
    });
    // FIXME: should be handled by each exception.
    process.on('uncaughtException', function(err) {
        console.log('server caught unexpeced error: ' + err.message);
    });

    // FIXME: node v5.0 later has process.uptime()
    var uptime_event_id = setInterval(function() {
        stats["uptime"] += 1;
    }, 1000);

    for (var type in process.versions ) {
        stats[type + "_version"] = process.versions[type];
    }

    var server = net.createServer(function(c) {
        stats["current_connection"]++;
        c.on('end', function() {
            stats["current_connection"]--;
        });
        c.on('error', function(error) {
            console.log("client socket error: " + error.message);
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
                case "delete": {
                    if ( cmd.length < 1 ) {
                        c.write("ERROR\r\n");
                    } else {
                        var keys = cmd;

                        for (var i=0; i < keys.length; i++ ) {
                            var key = cmd[i];
                            stats["item_count"] -= db[key]["unique_count"];
                            db[key] = undefined;
                        }

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
                                    "unique_count": 0,
                                    "sum": 0,
                                    "sum_square": 0,
                                    "item": {
                                        value: 0,
                                    },
                                };
                            }
                            db[key]["set_count"]++;
                            if ( db[key]["item"][value] == null ) {
                                stats["item_count"]++;
                                db[key]["unique_count"]++;
                            };
                            if ( value.match(/^[0-9][0-9\.]*$/) ) {
                                var num = parseFloat(value);
                                db[key]["sum"] += num;
                                db[key]["sum_square"] += ( num * num );
                            }
                            db[key]["item"][value]++;
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
                                var value;
                                switch ( property ) {
                                    case "average": {
                                        value = db[key]["sum"] / db[key]["set_count"];
                                        break;
                                    }
                                    case "variance": {
                                        // XXX: In case sum_square ** 2 is too big, it is not precise.
                                        // V(x) = E(x**2) - E(x)**2
                                        var avg = db[key]["sum"] / db[key]["set_count"];
                                        var avg_square = db[key]["sum_square"] / db[key]["set_count"];
                                        value = avg_square - avg * avg;
                                        break;
                                    }
                                    default : {
                                        value = db[key][property];
                                        break;
                                    }
                                }
                                c.write(["VALUE", key, value].join(" ") + "\r\n");
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

    server.listen(DEFAULT_PORT, function() {
        console.log('starting server');
    });
}();
