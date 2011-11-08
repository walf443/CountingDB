
require('../test_helper.js');
var counting_db = require('../lib/counting_db/server');
"use strict";

QUnit.module("testing server.log", {});

var mock_logger = function() {
    return this;
};
mock_logger.prototype.message = "";
mock_logger.prototype.log = function(message) {
    this.message += message;
};

QUnit.test("in case log_level is debug", function() {
    var server = new counting_db.server({
        "logger": new mock_logger(),
        "log_level": "debug",
    });

    var d = new Date(2011, 11, 5, 14, 32, 45);
    server.log("debug", "foo bar", d);
    QUnit.equal(server.logger.message, "[Mon Dec 05 2011 14:32:45 GMT+0900 (JST)][debug] foo bar", "should be logged");
});

QUnit.test("in case log_level is info", function() {
    var server = new counting_db.server({
        "logger": new mock_logger(),
        "log_level": "info",
    });

    var d = new Date(2011, 11, 5, 14, 32, 45);
    server.log("debug", "foo bar", d);
    QUnit.equal(server.logger.message, "", "should not be logged");
});

QUnit.start();
