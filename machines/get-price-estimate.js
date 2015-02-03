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
    startLatitude: {
      example: 37.623908,
      description: 'Latitude component of start location.',
      required: true
    },
    startLongitude: {
      example: -122.381592,
      description: 'Longitude component of start location.',
      required: true
    },
    endLatitude: {
      example: 37.623908,
      description: 'Latitude component of end location.',
      required: true
    },
    endLongitude: {
      example: -122.401213,
      description: 'Longitude component of end location.',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.'
    },
    rateLimitExceeded: {
      description: 'The rate limit has been exceeded.'
    },
    tooFar: {
      description: 'Distance between two points exceeds 100 miles.'
    },
    invalidApiKey: {
      description: 'Invalid api key.'
    },
    noPriceAvail: {
      description: 'There is no available price for this location.'
    },
    success: {
      description: 'Returns an estimated price range for each product offered at a given location.',
      example: [{
        productId: '08f17084-23fd-4103-aa3e-9b660223934b',
        currencyCode: 'USD',
        displayName: 'UberBLACK',
        estimate: '$23-29',
        lowEstimate: 23,
        highEstimate: 29,
        surgeMultiplier: 1,
        duration: 640,
        distance: 5.34
      }]
    }
  },
  fn: function(inputs, exits) {

    var util = require('util');
    var _ = require('lodash');
    var Http = require('machinepack-http');


    Http.sendHttpRequest({
      baseUrl: 'https://api.uber.com',
      url: '/v1/estimates/price',
      method: 'get',
      params: {
        server_token: inputs.apiKey,
        start_latitude: inputs.startLatitude,
        start_longitude: inputs.startLongitude,
        end_latitude: inputs.endLatitude,
        end_longitude: inputs.endLongitude
      }
    }).exec({
      // OK.
      success: function(httpResponse) {

        // Parse response body and build up result.
        var responseBody;
        try {
          responseBody = JSON.parse(httpResponse.body);

          if (_.isEmpty(responseBody.prices)) {
            return exits.noPriceAvail('There is no available price for this loctaion.');
          }

          if (!responseBody.prices) {
            return exits.error('Unexpected response from Uber API:\n' + util.inspect(responseBody, false, null));
          }
        } catch (e) {
          return exits.error('Unexpected response from Uber API:\n' + util.inspect(responseBody, false, null) + '\nParse error:\n' + util.inspect(e));
        }

        responseBody.prices = _.reduce(responseBody.prices, function(memo, priceMetadata) {
          memo.push({
            productId: priceMetadata.product_id,
            currencyCode: priceMetadata.currency_code,
            displayName: priceMetadata.display_name,
            estimate: priceMetadata.estimate,
            lowEstimate: priceMetadata.low_estimate,
            highEstimate: priceMetadata.high_estimate,
            surgeMultiplier: priceMetadata.surge_multiplier,
            duration: priceMetadata.duration,
            distance: priceMetadata.distance 
          });
          return memo;
        }, []);


        return exits.success(responseBody.prices);

      },
      // Non-2xx status code returned from server
      notOk: function(httpResponse) {

        try {
          var responseBody = JSON.parse(httpResponse.body);
  
          if (httpResponse.status === 401) {
            return exits.invalidApiKey('Invalid api key.');
          }
          if (httpResponse.status === 422) {
            return exits.tooFar('Distance between two points exceeds 100 miles.');
          }
          if (httpResponse.status === 429 && _.any(responseBody.error.errors, {
              reason: 'rateLimitExceeded'
            })) {
            return exits.rateLimitExceeded();
          }
          // Unknown uber error
          return exits.error(httpResponse);
        } catch (e) {
          return exits.error('Unexpected response from Uber API:\n' + util.inspect(responseBody, false, null) + '\nParse error:\n' + util.inspect(e));
        }

      },
      // An unexpected error occurred.
      error: function(err) {
        return exits.error(err);
      }
    });

  },

};