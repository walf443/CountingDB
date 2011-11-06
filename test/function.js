
require('../test_helper.js');
var counting_db = require('counting_db/server');
"use strict";

QUnit.module("testing server function", {});

QUnit.test("average", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    QUnit.equal(server.average(10, 30), 3, "should be 3");
    QUnit.equal(server.average(3, 30), 10, "should be 10");
    QUnit.equal(server.average(60, 30), 0.5, "should be 0.5");
});

QUnit.test("variance", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var sample1 = [10, 20, 30, 40, 50];
    var sum_sample1 = 0;
    var sum_square_sample1 = 0;
    for (var i = 0; i < sample1.length; i++ ) {
        sum_sample1 += sample1[i];
        sum_square_sample1 += sample1[i] * sample1[i];
    }
    var avg_sample1 = server.average(sample1.length, sum_sample1);

    var sum_diff = 0;
    for (var j = 0; j < sample1.length; j++ ) {
        sum_diff += ( ( sample1[j] - avg_sample1 ) * ( sample1[j] - avg_sample1 ) );
    }
    var expected_variance = server.average(sample1.length, sum_diff);

    QUnit.equal(server.variance(sample1.length, sum_sample1, sum_square_sample1), expected_variance, "variance ok");

});

QUnit.start();
