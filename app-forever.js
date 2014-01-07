var forever = require('forever-monitor');

var child = new (forever.Monitor)('app.js', {
	minUptime: 10000,
	spinSleepTime: 10000
});

child.start();