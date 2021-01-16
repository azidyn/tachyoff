
const config    = require('./config')
const exchanges = require('./exchanges');
const sample    = require('./sample');
const reporting = require('./report');

// e.g. 'newyork', 'tokyo', 'singapore' whatever, pass on cmdline when booting script
const region = process.argv[2] || 'london'; 

console.log(`reegion=${region}`);

(async()=>{

    // Sample all exchanges continuously
    for ( ;; ) {

        const results = [];
        
        // The sample 'window' for our exchanes
        const epoch = Date.now();
        const timestamp = ( new Date( epoch) ).toISOString();


        // Sample each exchange in turn
        for ( const exchange in exchanges ) {

            const result = await sample( exchanges[ exchange ] );

            results.push({
                region,
                epoch, timestamp,
                exchange,
                result
            });

        }

        console.log( results )

        // transmit report to central server for collation, presentation
        // await reporting.send( results );

        // console.log(`Scan all: ${((Date.now() - epoch) / 1000).toFixed(1)}s`);

        // Wait a bit 
        await config.delay( config.globalcooloff );

    }
    

})();
