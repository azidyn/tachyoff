
const config    = require('./config')
const exchanges = require('./exchanges');
const sample    = require('./sample');
// const reporting = require('./report');

// e.g. 'newyork', 'tokyo', 'singapore' whatever, pass on cmdline when booting script
const region = process.argv[2] || 'london'; 

(async()=>{

    // Sample all exchanges continuously
    for ( ;; ) {

        let reports = [];

        // Sample each exchange in turn
        for ( const exchange in exchanges ) {
            
            const result = await sample( exchanges[ exchange ] );

            const n = Date.now();

            const report = {
                region,
                epoch: n,
                timestamp: (new Date( n )).toISOString(),
                exchange,
                result
            }

            console.log( report );

            reports.push( report );
        }


        // transmit report to central server for collation, presentation
        // await reporting.send( reports );

        // Wait a bit 
        await config.delay( config.globalcooloff );

    }
    

})();
