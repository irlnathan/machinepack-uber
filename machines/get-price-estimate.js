module.exports = {
  friendlyName: 'Get price estimate',
  description: 'A price estimate for each product offered.',
  extendedDescription: '',
  inputs: {
    apiKey: {
      example: 'xAmBxAmBxAmBkjbyKkjbyKkjbyK',
      description: 'The private Uber API key for this application.',
      required: true,
      whereToGet: {
        url: 'https://developer.uber.com/apps/',
        description: 'Copy and paste an API key, or create one if you haven\'t already.',
        extendedDescription: ''
      }
    },
    start_latitude: {
      example: '37.623908',
      description: 'Latitude component of start location.',
      required: true
    },
    end_latitude: {
      example: '37.623908',
      description: 'Latitude component of end location.',
      required: true
    },
    start_longitude: {
      example: '-122.381592',
      description: 'Longitude component of start location.',
      required: true
    },
    end_longitude: {
      example: '-122.401213',
      description: 'Longitude component of end location.',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.'
    },
    success: {
      description: ' Returns an estimated price range for each product offered at a given location.',
      example: {
        "prices": [{
          "product_id": "08f17084-23fd-4103-aa3e-9b660223934b",
          "currency_code": "USD",
          "display_name": "UberBLACK",
          "estimate": "$23-29",
          "low_estimate": 23,
          "high_estimate": 29,
          "surge_multiplier": 1,
          "duration": 640,
          "distance": 5.34
        }, {
          "product_id": "9af0174c-8939-4ef6-8e91-1a43a0e7c6f6",
          "currency_code": "USD",
          "display_name": "UberSUV",
          "estimate": "$36-44",
          "low_estimate": 36,
          "high_estimate": 44,
          "surge_multiplier": 1.25,
          "duration": 640,
          "distance": 5.34
        }, {
          "product_id": "aca52cea-9701-4903-9f34-9a2395253acb",
          "currency_code": null,
          "display_name": "uberTAXI",
          "estimate": "Metered",
          "low_estimate": null,
          "high_estimate": null,
          "surge_multiplier": 1,
          "duration": 640,
          "distance": 5.34
        }, {
          "product_id": "a27a867a-35f4-4253-8d04-61ae80a40df5",
          "currency_code": "USD",
          "display_name": "uberX",
          "estimate": "$15",
          "low_estimate": 15,
          "high_estimate": 15,
          "surge_multiplier": 1,
          "duration": 640,
          "distance": 5.34
        }]
      }
    }
  },
  fn: function(inputs, exits) {

    var util = require('util');
    var URL = require('url');
    var QS = require('querystring');
    var _ = require('lodash');
    var Http = require('machinepack-http');

    // The Uber API URL setup
    var BASE_URL = 'https://api.uber.com';

    Http.sendHttpRequest({
      baseUrl: BASE_URL,
      url:
      '/v1/estimates/price?server_token='+inputs.apiKey+
      '&start_latitude='+inputs.start_latitude+
      '&end_latitude='+inputs.end_latitude+
      '&start_longitude='+inputs.start_longitude+
      '&end_longitude='+inputs.end_longitude,
      method: 'get',
    }).exec({
      // OK.
      success: function(httpResponse) {

        // Parse response body and build up result.
        var responseBody;
        var result;
        try {
          responseBody = JSON.parse(httpResponse.body);
          console.log(responseBody);
        } catch (e) {
          return exits.error('Unexpected response from Uber API:\n'+util.inspect(responseBody, false, null)+'\nParse error:\n'+util.inspect(e));
        }

        return exits.success(result);

      },
      // Non-2xx status code returned from server
      notOk: function(httpResponse) {

        try {
          var responseBody = JSON.parse(httpResponse.body);
          if (httpResponse.status === 429 && _.any(responseBody.error.errors, {
              reason: 'rateLimitExceeded'
            })) {
            return exits.rateLimitExceeded();
          }
          // Unknown youtube error
          return exits.error(httpResponse);
        } catch (e) {
          return exits.error('Unexpected response from Uber API:\n'+util.inspect(responseBody, false, null)+'\nParse error:\n'+util.inspect(e));
        }

      },
      // An unexpected error occurred.
      error: function(err) {
        return exits.error(err);
      }
    });

  },

};