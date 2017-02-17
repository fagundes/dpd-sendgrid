/**
 * Module dependencies
 */

var Resource = require('deployd/lib/resource'),
    util = require('util'),
    SendGridService = require('sendgrid'),
    MailHelper = require('sendgrid').mail;

/**
 * Module Setup
 */

function SendGrid() {

    Resource.apply(this, arguments);
    var apiToken = this.config.apiToken || process.env.SENDGRID_API_TOKEN;

    var sg = SendGridService(apiToken);

    var createRequest = function (data) {

        var mail = new MailHelper.Mail();
        var pers = new MailHelper.Personalization();

        mail.addPersonalization(pers);

        pers.addTo(new MailHelper.Email(data.to));
        mail.setFrom(new MailHelper.Email(data.from));
        mail.setSubject(data.subject);

        if (data.html) {
            mail.addContent(new MailHelper.Content('text/html', data.html));
        }

        if (data.text) {
            mail.addContent(new MailHelper.Content('text/plain', data.text));
        }

        // todo add support bcc and cc

        return sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
        });
    };

    this.send = function (data, callback) {
        console.log(data);
        sg.API(createRequest(data), callback);
    };
}
util.inherits(SendGrid, Resource);

SendGrid.prototype.clientGeneration = true;

SendGrid.basicDashboard = {
    settings: [
        {
            name: 'apiToken',
            type: 'text',
            description: 'SendGrid API Token. Leave blank to use the SENDGRID_API_TOKEN env variable'
        },
        {
            name: 'defaultFromAddress',
            type: 'text',
            description: 'Optional; if not provided will use the SENDGRID_DEFAULT_FROM env var or you will need to provide a \'from\' address in every request'
        },
        {
            name: 'internalOnly',
            type: 'checkbox',
            description: 'Only allow internal scripts to send email'
        },
        {
            name: 'productionOnly',
            type: 'checkbox',
            description: 'If on development mode, print emails to console instead of sending them'
        }
    ]
};

/**
 * Module methods
 */

SendGrid.prototype.handle = function (ctx, next) {

    if (ctx.req && ctx.req.method !== 'POST') {
        return next();
    }

    if (!ctx.req.internal && this.config.internalOnly) {
        return ctx.done({statusCode: 403, message: 'Forbidden'});
    }

    var options = ctx.body || {};
    options.from = options.from || this.config.defaultFromAddress || process.env.SENDGRID_DEFAULT_FROM;

    var errors = {};
    if (!options.to) {
        errors.to = '\'to\' is required';
    }
    if (!options.from) {
        errors.from = '\'from\' is required';
    }
    if (!options.text && !options.html) {
        errors.text = '\'text\' or \'html\' is required';
    }
    if (Object.keys(errors).length) {
        return ctx.done({statusCode: 400, errors: errors});
    }

    // trim
    options.subject = options.subject ? options.subject.trim() : '';
    options.text = options.text ? options.text.trim() : '';

    var that = this;

    var env = that.options.server.options.env;
    if (that.config.productionOnly && env != 'production') {
        console.log('_______________________________________________');
        console.log('Sent email:');
        console.log('From:    ', options.from);
        console.log('To:      ', options.to);
        if (options.cc) {
            console.log('CC:      ', options.cc);
        }
        if (options.bcc) {
            console.log('BCC:      ', options.bcc);
        }
        console.log('Subject: ', options.subject);
        if (options.text) {
            console.log('Text:');
            console.log(options.text);
        }
        if (options.html) {
            console.log('HTML:');
            console.log(options.html);
        }
        console.log('```````````````````````````````````````````````');
        return ctx.done(null, {message: 'Simulated sending'});
    }

    this.send(options, function (error, response) {

        if (error) {
            console.log('Error response received');
            return ctx.done(error);
        }

        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
        ctx.done(null, {message: response.body});
    });
};

/**
 * Module export
 */

module.exports = SendGrid;