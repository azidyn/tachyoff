
const config    = require('./config')
const exchanges = require('./exchanges');
const sample    = require('./sample');

(async()=>{

    // Sample all exchanges continuously
    for ( ;; ) {

        // Sample each exchange in turn
        for ( const exchange in exchanges ) {
            
            const result = await sample( exchanges[ exchange ] );

            const n = Date.now();

            const report = {
                epoch: n,
                timestamp: (new Date( n )).toISOString(),
                exchange,
                result
            }

            console.log( report );

        }


        // Wait a bit 
        await config.delay( config.globalcooloff );

    }
    

})();
