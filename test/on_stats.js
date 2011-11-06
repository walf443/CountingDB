
var t = require('../test_helper.js');
var counting_db = require('counting_db/server');
"use strict";

QUnit.module("testing server.on_stats", {});

QUnit.test("testing server.on_stats", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_stats(client);

    QUnit.ok(client.writeBuffer.match(/STAT cmd_get 0\r\n/), "cmd_get OK");
    QUnit.ok(client.writeBuffer.match(/STAT cmd_count 0\r\n/), "cmd_count OK");
    QUnit.ok(client.writeBuffer.match(/STAT current_connections 0\r\n/), "current_connections OK");
    QUnit.ok(client.writeBuffer.match(/STAT item_count 0\r\n/), "item_count OK");
    QUnit.ok(client.writeBuffer.match(/STAT pid \d+\r\n/), "pid OK");
    QUnit.ok(client.writeBuffer.match(/STAT uptime 0\r\n/), "uptime OK");
    QUnit.ok(client.writeBuffer.match(/STAT rss \d+\r\n/), "rss OK");
    QUnit.ok(client.writeBuffer.match(/STAT heap_total \d+\r\n/), "heap_total OK");
    QUnit.ok(client.writeBuffer.match(/STAT heap_used \d+\r\n/), "heap_used OK");

    QUnit.ok(client.writeBuffer.match(/STAT node_version .+\r\n/), "node_version OK");
    QUnit.ok(client.writeBuffer.match(/STAT v8_version .+\r\n/), "v8_version OK");
    QUnit.ok(client.writeBuffer.match(/STAT ares_version .+\r\n/), "ares_version OK");
    QUnit.ok(client.writeBuffer.match(/STAT ev_version .+\r\n/), "ev_version OK");
    QUnit.ok(client.writeBuffer.match(/STAT openssl_version .+\r\n/), "openssl_version OK");

    QUnit.ok(client.writeBuffer.match(/END\r\n$/), "protocol should end with END");
});

QUnit.start();
