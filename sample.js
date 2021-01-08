
const config = require('./config');

module.exports = REQ => new Promise( async resolve => {

        let errors = 0;
        let samples = [];

        for ( let i=0; i < config.samples; i++ ) {

            const res = await config.test( REQ );

            if ( res.error )
                errors++;
            else
                samples.push( res.end );

            // Don't spam the server, 1 sec should do it in most cases.
            await config.delay( config.wait );

        }
       
        resolve({ 
            samples: config.samples,
            errors,
            failed: errors == config.samples,
            roundtrip: !samples.length ? -1 : ( samples.reduce( (a,c) => a + c, 0 ) ) / samples.length       
        });

    });


