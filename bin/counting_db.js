#!/usr/bin/env node

require.paths.push('./lib/');
var counting_db = require('counting_db/server');
var s = new counting_db.server();
s.run();
