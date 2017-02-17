/**
 * Module dependencies
 */

var Resource = require('deployd/lib/resource'),
    util = require('util'),
    SendGridService = require('sendgrid');

/**
 * Module Setup
 */

function SendGrid() {

    Resource.apply(this, arguments);
    var apiToken = this.config.apiToken || process.env.SENDGRID_API_TOKEN;

    var sg = SendGridService(apiToken);

    var createRequest = function (data) {

        var request = {
            method: 'POST',
            path: '/v3/mail/send',
            personalizations: [
                {
                    to: [],
                    subject: ''
                }
            ],
            from: {},
            content: []
        };

        request.personalizations[0].subject = data.subject;

        if (typeof data.to == 'string') {
            request.personalizations[0].to[0] = {};
            request.personalizations[0].to[0].email = data.to;
        }
        else if (typeof data.to == 'Array') {
            request.personalizations[0].to = data.to;
        }
        else if (typeof data.to == 'object') {
            request.personalizations[0].to[0] = data.to;
        }

        if (typeof data.from == 'string') {
            request.from.email = data.from;
        }
        else if (typeof data.from == 'object') {
            request.from = data.from;
        }

        if (data.html) {
            request.content.push({
                type: 'text/html',
                value: data.html
            });
        }

        if (data.text) {
            request.content.push({
                type: 'text/plain',
                value: data.text
            });
        }

        return sg.emptyRequest(request);
    };

    this.send = function (data, callback) {
        var request = createRequest(data);

        //With callback
        sg.API(request, callback);
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