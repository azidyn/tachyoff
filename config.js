
const request = require('request');

module.exports = {

    // General settings 
    samples: 3,                 // take an average of 3 readings
    wait: 1000,                 // wait 1 second before retesting a single api's endpoint
    globalcooloff: 5 * 1000,    // wait 5 seconds before retesting all exchanges

    // Let's double up this config as a util file too why not
    delay: ms => new Promise( resolve => setTimeout( resolve, ms )),

    // Wrap single request into a promise
    test: uri => new Promise( resolve => {

        request({

            uri,
            method: 'GET',
            time: true

        }, (err, resp) => {

            resolve( err ? { error: true } : resp.timings );

            /*
                re: https://github.com/request/request#requestoptions-callback

                `timings` Contains event timestamps in millisecond resolution relative to timingStart. If there were redirects, the properties reflect the timings of the final request in the redirect chain:

                socket Relative timestamp when the http module's socket event fires. This happens when the socket is assigned to the request.
                lookup Relative timestamp when the net module's lookup event fires. This happens when the DNS has been resolved.
                connect: Relative timestamp when the net module's connect event fires. This happens when the server acknowledges the TCP connection.
                response: Relative timestamp when the http module's response event fires. This happens when the first bytes are received from the server.
                end: Relative timestamp when the last bytes of the response are received.

            */

        });        

    })

}