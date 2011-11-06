
require('../test_helper.js');
var counting_db = require('counting_db/server');
"use strict";

QUnit.module("testing server.on_ping", {});

var mock_client = function() {
};
mock_client.prototype.writeBuffer = "";
mock_client.prototype.write = function(msg) {
    this.writeBuffer += msg;
};

QUnit.test("testing server.on_ping", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new mock_client();
    server.on_ping(client);
    QUnit.equal(client.writeBuffer, "PONG\r\n", "response OK");
});

QUnit.start();
