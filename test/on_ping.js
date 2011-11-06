
var t = require('../test_helper.js');
var counting_db = require('counting_db/server');
"use strict";

QUnit.module("testing server.on_ping", {});

QUnit.test("testing server.on_ping", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_ping(client);
    QUnit.equal(client.writeBuffer, "PONG\r\n", "response OK");
});

QUnit.start();
