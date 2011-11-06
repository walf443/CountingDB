CountingDB - middleware for counting up
==============

USAGE
----------------------------------

	$ node bin/counting_db.js

and try via another terminal

	$ echo "count value key1 key2"
	OK

	$ echo "get set_count key1" | nc localhost 26006
	VALUE key1 1
	END

	$ echo "get unique_count key1" | nc localhost 26006
	VALUE key1 1
	END

	$ echo "stats" | nc localhost 26006
	STAT cmd_count 0
	STAT cmd_get 0
	STAT current_connections 1
	STAT item_count 0
	STAT pid 54002
	STAT uptime 20
	STAT node_version 0.4.12
	STAT v8_version 3.1.8.26
	STAT ares_version 1.7.4
	STAT ev_version 4.4
	STAT openssl_version 0.9.8l
	STAT rss 13778944
	STAT heap_total 5510272
	STAT heap_used 3275280
	END

DESCRIPTION
----------------------------------

RUNNING TEST
---------------------------------------
you should get dependency.

	$ npm install .

And then, you can easy to test with Test::Harness's prove command

	$ prove -v --exec=node test/*.js

or

	$ ls test/*.js | xargs -I% node %

LICENSE
---------------------------------------
Copyright (c) 2011 Keiji Yoshimi
licensed under the MIT.

