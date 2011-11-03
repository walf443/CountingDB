(function()
{
    "use strict";
    var net = require('net');

    exports.DEFAULT_PORT = 26006;

    var server = function(options) {
        if ( ! options ) {
            options = {};
        }
        if ( options["port"] ) {
            this.port = options["port"];
        }
        return this;
    };
    exports.server = server;

    server.prototype.stats = {
        "cmd_count": 0,
        "cmd_get": 0,
        "current_connection": 0,
        "item_count": 0,
        "pid": process.pid,
        "uptime": 0,
    };
    server.prototype.db = {
    };

    server.prototype.port = exports.DEFAULT_PORT;

    server.prototype.on_ping = function(client) {
        client.write("PONG\r\n");
    };

    server.prototype.on_stats = function(client) {
        var memusage = process.memoryUsage();
        this.stats["rss"] = memusage["rss"];
        this.stats["heap_total"] = memusage["heapTotal"];
        this.stats["heap_used"] = memusage["heapUsed"];

        for (var key in this.stats ) {
            client.write("STAT " + key + " " + this.stats[key] + "\r\n");
        }
        client.write("END\r\n");
    };

    server.prototype.on_delete = function(client, keys) {
        for (var i=0; i < keys.length; i++ ) {
            var key = keys[0];
            this.stats["item_count"] -= this.db[key]["unique_count"];
            this.db[key] = undefined;
        }

        client.write("OK\r\n");
    };

    server.prototype.on_count = function(client, value, keys) {
        this.stats["cmd_count"]++;

        for (var i=0; i < keys.length; i++ ) {
            var key = keys[i];
            if ( !this.db[key] ) {
                this.db[key] = {
                    "set_count": 0,
                    "unique_count": 0,
                    "sum": 0,
                    "sum_square": 0,
                    "item": {
                        value: 0,
                    },
                };
            }
            this.db[key]["set_count"]++;
            if ( this.db[key]["item"][value] == null ) {
                this.stats["item_count"]++;
                this.db[key]["unique_count"]++;
            };
            if ( value.match(/^[0-9][0-9\.]*$/) ) {
                var num = parseFloat(value);
                this.db[key]["sum"] += num;
                this.db[key]["sum_square"] += ( num * num );
            }
            this.db[key]["item"][value]++;
        }
        client.write("OK\r\n");
    };

    server.prototype.run = function() {
        var self = this;

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
            self.stats["uptime"] += 1;
        }, 1000);

        for (var type in process.versions ) {
            this.stats[type + "_version"] = process.versions[type];
        }

        var server = net.createServer(function(c) {
            self.stats["current_connection"]++;
            c.on('end', function() {
                self.stats["current_connection"]--;
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
                        self.on_ping(c);
                        break;
                    }
                    case "stats" : {
                        self.on_stats(c);
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
                            self.on_delete(c, cmd);
                        }
                        break;
                    }
                    case "count": {
                        if ( cmd < 3 ) {
                            c.write("ERROR\r\n");
                        } else {
                            var value = cmd.shift();
                            var keys = cmd;
                            self.on_count(c, value, keys);

                        }
                        break;
                    }
                    case "get": {
                        if ( cmd < 3 ) {
                            c.write("ERROR\r\n");
                        } else {
                            self.stats["cmd_get"]++;

                            var property = cmd.shift();
                            var keys = cmd;
                            for (var i=0; i < keys.length; i++ ) {
                                var key = keys[i];
                                if ( self.db[key] ) {
                                    var value;
                                    switch ( property ) {
                                        case "average": {
                                            value = self.db[key]["sum"] / self.db[key]["set_count"];
                                            break;
                                        }
                                        case "variance": {
                                            // XXX: In case sum_square ** 2 is too big, it is not precise.
                                            // V(x) = E(x**2) - E(x)**2
                                            var avg = self.db[key]["sum"] / self.db[key]["set_count"];
                                            var avg_square = self.db[key]["sum_square"] / self.db[key]["set_count"];
                                            value = avg_square - avg * avg;
                                            break;
                                        }
                                        default : {
                                            value = self.db[key][property];
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

        server.listen(this.port, function() {
            console.log('starting server on 0.0.0.0:' + self.port);
        });

    }

    return this;
})();
