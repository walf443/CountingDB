(function()
{
    "use strict";

    // Example:
    //      var counting_db = require('counting_db.server');
    //      var s = new conting_db.server({
    //          "port": 26006, // default
    //      });
    //      s.run();
    //
    var net = require('net');

    exports.DEFAULT_PORT = 26006;

    var server = function(options) {
        if ( ! options ) {
            options = {};
        }
        if ( options["port"] ) {
            this.port = options["port"];
        }
        if ( options["logger"] ) {
            this.logger = options["logger"];
        }

        if ( options["process"] ) {
            this.process = options["process"];
        }

        this.stats["pid"] = this.process.pid;

        return this;
    };
    exports.server = server;

    server.prototype.stats = {
        "cmd_count": 0,
        "cmd_get": 0,
        "current_connection": 0,
        "item_count": 0,
        "pid": 0,
        "uptime": 0,
    };
    server.prototype.db = {
    };

    server.prototype.port = exports.DEFAULT_PORT;
    server.prototype.logger = console;
    server.prototype.process = process;

    // @public
    server.prototype.run = function() {
        var self = this;

        // FIXME: I don't like to hook process event not as possible.
        this.process.on('exit', function() {
            this.log('info', 'server terminate.');
        });
        // FIXME: should be handled by each exception.
        this.process.on('uncaughtException', function(err) {
            this.log('error', 'server caught unexpeced error: ' + err.message);
        });

        // FIXME: node v5.0 later has process.uptime()
        var uptime_event_id = setInterval(function() {
            self.stats["uptime"] += 1;
        }, 1000);

        for (var type in this.process.versions ) {
            this.stats[type + "_version"] = this.process.versions[type];
        }

        var server = net.createServer(function(c) {
            self.stats["current_connection"]++;
            c.on('end', function() {
                self.stats["current_connection"]--;
            });
            c.on('error', function(error) {
                self.log("error", "client socket error: " + error.message);
            });

            c.on('data', function(data) {
                self.on_read(c, data);
            });
        });

        server.listen(this.port, function() {
            self.log('info', 'starting server on 0.0.0.0:' + self.port);
        });

    }

    // @private
    server.prototype.log = function(level, message) {
        this.logger.log("[" + level + "] " + message);
    }

    // @private
    server.prototype.on_read = function(client, line) {
        var cmd = line.toString().split(/\s+/);
        cmd.pop();
        var command = cmd.shift();
        switch ( command ) {
            case "ping" : {
                this.on_ping(client);
                break;
            }
            case "stats" : {
                this.on_stats(client);
                break;
            }
            case "add_keys": {
                if ( cmd.length < 2 ) {
                    client.write("ERROR\r\n");
                } else {
                    client.write("OK\r\n");
                }
                break;
            }
            case "delete": {
                if ( cmd.length < 1 ) {
                    client.write("ERROR\r\n");
                } else {
                    this.on_delete(client, cmd);
                }
                break;
            }
            case "count": {
                if ( cmd < 3 ) {
                    client.write("ERROR\r\n");
                } else {
                    var value = cmd.shift();
                    var keys = cmd;
                    this.on_count(client, value, keys);

                }
                break;
            }
            case "get": {
                if ( cmd < 3 ) {
                    client.write("ERROR\r\n");
                } else {
                    var property = cmd.shift();
                    var keys = cmd;
                    this.on_get(client, property, keys);

                    break;
                }
            }
            default: {
                client.write("ERROR\r\n");
                break;
            }
        }
    };

    // @private
    server.prototype.on_ping = function(client) {
        client.write("PONG\r\n");
    };

    // @private
    server.prototype.on_stats = function(client) {
        var memusage = this.process.memoryUsage();
        this.stats["rss"] = memusage["rss"];
        this.stats["heap_total"] = memusage["heapTotal"];
        this.stats["heap_used"] = memusage["heapUsed"];

        for (var key in this.stats ) {
            client.write("STAT " + key + " " + this.stats[key] + "\r\n");
        }
        client.write("END\r\n");
    };

    // @private
    server.prototype.on_delete = function(client, keys) {
        for (var i=0; i < keys.length; i++ ) {
            var key = keys[0];
            this.stats["item_count"] -= this.db[key]["unique_count"];
            this.db[key] = undefined;
        }

        client.write("OK\r\n");
    };

    // @private
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

    // @private
    server.prototype.on_get = function(client, property, keys) {
        this.stats["cmd_get"]++;
        for (var i=0; i < keys.length; i++ ) {
            var key = keys[i];
            if ( this.db[key] ) {
                var value;
                switch ( property ) {
                    case "average": {
                        value = this.db[key]["sum"] / this.db[key]["set_count"];
                        break;
                    }
                    case "variance": {
                        // XXX: In case sum_square ** 2 is too big, it is not precise.
                        // V(x) = E(x**2) - E(x)**2
                        var avg = this.db[key]["sum"] / this.db[key]["set_count"];
                        var avg_square = this.db[key]["sum_square"] / this.db[key]["set_count"];
                        value = avg_square - avg * avg;
                        break;
                    }
                    default : {
                        value = this.db[key][property];
                        break;
                    }
                }
                client.write(["VALUE", key, value].join(" ") + "\r\n");
            }
        }
        client.write("END\r\n");
    };

    return this;
})();
