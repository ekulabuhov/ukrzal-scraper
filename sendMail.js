const sendmail = require('sendmail')();

module.exports = (subject, html) => sendmail({
    from: 'no-reply@yourdomain.com',
    to: 'eugene.kulabuhov@gmail.com',
    subject,
    html,
  }, function(err, reply) {
    console.log(err && err.stack);
    console.dir(reply);
});