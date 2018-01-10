const sendmail = require("sendmail")();

module.exports = (subject, html) =>
	new Promise((resolve, reject) => {
		sendmail(
			{
				from: "no-reply@yourdomain.com",
				to: "eugene.kulabuhov@gmail.com",
				subject,
				html
			},
			function(err, reply) {
				if (err) {
					console.log(err && err.stack);
					reject(err);
				} else {
					console.dir(reply);
					resolve(reply);
				}
			}
		);
	});
