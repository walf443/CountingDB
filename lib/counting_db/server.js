(function()
{
    "use strict";

    // Example:
    //      var counting_db = require('counting_db/server');
    //      var s = new conting_db.server({
    //          "port": 26006, // default
    //      });
    //      s.run();
    //
    var net = require('net');
    var fs  = require('fs');
    var microtime = require('microtime');

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

        if ( options["log_level"] ) {
            this.log_level = options["log_level"];
        }

        if ( options["datadir"] ) {
            this.datadir = options["datadir"];
        }

        this.db = {};
        var orig_stats = this.stats;
        this.stats = {};
        for (var prop in orig_stats ) {
            this.stats[prop] = orig_stats[prop];
        }

        this.stats["pid"] = this.process.pid;
        for (var type in this.process.versions ) {
            this.stats[type + "_version"] = this.process.versions[type];
        }

        return this;
    };
    exports.server = server;

    server.prototype.stats = {
        "cmd_count": 0,
        "cmd_get": 0,
        "current_connections": 0,
        "item_count": 0,
        "pid": 0,
        "uptime": 0,
        "server_time": 0,
    };
    server.prototype.db = {
    };

    server.prototype.port = exports.DEFAULT_PORT;
    server.prototype.datadir = ".";
    server.prototype.logger = console;
    server.prototype.process = process;
    server.prototype.log_levels = {
        "debug" : 0,
        "info"  : 1,
        "warn"  : 2,
        "error" : 3,
    };
    server.prototype.log_level = "info";

    // @public
    server.prototype.run = function() {
        var self = this;

        // FIXME: I don't like to hook process event not as possible.
        this.process.on('exit', function() {
            self.log('info', 'server terminate.');
        });
        // FIXME: should be handled by each exception.
        this.process.on('uncaughtException', function(err) {
            self.log('error', 'server caught unexpeced error: ' + err.message);
        });

        // FIXME: node v5.0 later has process.uptime()
        var uptime_event_id = setInterval(function() {
            self.stats["uptime"] += 1;
        }, 1000);

        var server = net.createServer(function(c) {
            self.log('debug', 'client connected from ' + c.remoteAddress + ":" + c.remotePort);
            self.stats["current_connections"]++;
            c.on('end', function() {
                self.stats["current_connections"]--;
                self.log('debug', 'client from ' + c.remoteAddress + ":" + c.remotePort + ' disconnected');
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
    server.prototype.log = function(level, message, d) {
        if ( this.log_levels[level] >= this.log_levels[this.log_level] ) {
            if ( ! d ) {
                d = new Date();
            }
            this.logger.log("[" + d.toString() + "][" + level + "] " + message);
        }
    }

    // @private
    server.prototype.on_read = function(client, line) {
        var cmd = line.toString().replace(/[\r\n]/g, '').split(/\s+/);
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
                if ( cmd.length < 2 ) {
                    client.write("ERROR\r\n");
                } else {
                    var value = cmd.shift();
                    var keys = cmd;
                    this.on_count(client, value, keys);

                }
                break;
            }
            case "get": {
                if ( cmd.length < 2 ) {
                    client.write("ERROR\r\n");
                } else {
                    var property = cmd.shift();
                    var keys = cmd;
                    this.on_get(client, property, keys);

                }
                break;
            }
            case "backup": {
                this.on_backup(client);
                break;
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
        this.stats["server_time"] = microtime.now();

        for (var key in this.stats ) {
            client.write("STAT " + key + " " + this.stats[key] + "\r\n");
        }
        client.write("END\r\n");
    };

    // @private
    server.prototype.on_delete = function(client, keys) {
        for (var i=0; i < keys.length; i++ ) {
            var key = keys[i];
            if ( this.db[key] ) {
                this.stats["item_count"] -= this.db[key]["unique_count"];
                this.db[key] = undefined;
            }
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
            switch ( property ) {
                case "average": {
                    if ( this.db[key] ) {
                        value = this.average(this.db[key]["set_count"], this.db[key]["sum"]);
                    }
                    break;
                }
                case "variance": {
                    if ( this.db[key] ) {
                        value = this.variance(this.db[key]["set_count"], this.db[key]["sum"], this.db[key]["sum_square"]);
                    }
                    break;
                }
                default : {
                    if ( this.db[key] ) {
                        value = this.db[key][property];
                    }
                    if ( value == undefined ) {
                        client.write("ERROR\r\n");
                        return;
                    }
                    break;
                }
            }
            if ( this.db[key] ) {
                var value;
                client.write(["VALUE", key, value].join(" ") + "\r\n");
            }
        }
        client.write("END\r\n");
    };

    // @private
    server.prototype.on_backup = function(client) {
        var self = this;
        var server_time = this.stats["server_time"] = microtime.now();
        var data = JSON.stringify(self.db);
        var snapshot = fs.writeFile(this.datadir + "/snapshot." + server_time, data, 'utf8', function(err) {
            if ( err ) {
                self.log("error", "got error while creating backup: " + err.message);
                client.write("ERROR\r\n");
            } else {
                client.write("OK\r\n");
            }
        });
    }

    // E(x) = sum(x) / n;
    //
    // @private
    server.prototype.average = function(num_of_element, sum) {
        return sum / num_of_element;
    };

    // XXX: In case sum_square ** 2 is too big, it is not precise.
    // V(X) = E(X-E(X))^2
    // V(X) = E(X**2) - E(x)**2
    //
    // @private
    server.prototype.variance = function(num_of_element, sum, sum_square) {
        var avg = this.average(num_of_element, sum);
        var avg_square = this.average(num_of_element, sum_square);
        return avg_square - avg * avg;
    };

    return this;
})();

