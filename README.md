SendGrid Resource
=================

Module for Deployd that allows you to send an email to your users.

This is built on SendGrid module.

Instalation
-----------

`$ npm install --save dpd-sendgrid`

See [Installing Modules](http://docs.deployd.com/docs/using-modules/) for details.

Configuration
-------------

Before using the email resource, you must go to its Dashboard page and configure it.

**apiToken**

SendGrid API Token. Leave blank to use the SENDGRID\_API\_TOKEN env variable.

### Optional settings:

**defaultFromAddress**
A "from" email address to provide by default. Leave this blank to use the SENDGRID\_DEFAULT\_FROM environment variable. If this is not provided, you will need to provide this address in every request.

**internalOnly**
If checked, only allow internal requests (such as those from events) to send emails. Recommended for security.

**productionOnly**
If checked, attempting to send an email in the development environment will simply print it to the Deployd console.

Usage
-----

To send an email, call dpd.sendgrid.post(options, callback) (replacing sendgrid with your resource name). The options argument is an object:

```
{

	// The email address of the sender. Required if defaultFromAddress is not configured.
	// Can be plain (sender@server.com) or formatted (Sender Name <sender@server.com>)
	from : "",

	// Comma separated list of recipients e-mail addresses that will appear on the To: field
	to : "",

	// Comma separated list of recipients e-mail addresses that will appear on the Cc: field
	cc : "",

	// Comma separated list of recipients e-mail addresses that will appear on the Bcc: field
	bcc : "",

	// The subject of the e-mail.
	subject : "",

	// The plaintext version of the message (can also be generated via templating)
	text : "",

	// The HTML version of the message;
	html : "",
}
```

Example Usage
-------------

```
// On POST /users

dpd.sendgrid.post({
  to      : this.email,
  subject : 'MyApp registration',
  text    : [
  	this.username,
  	'',
  	'Thank you for registering for MyApp!'
  ].join('\n')
}, function ( err, results ) {
	// ...
});
```