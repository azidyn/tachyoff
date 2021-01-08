

const exchange = process.argv[2] || 'bitmex';
const config = require('./config')
const secret_reporting_api = require('./report');
const api = require(`./exchange/${exchange}`);

(async()=>{

    setInterval( async () => {

        let result = await api.measure(); 

        let packet = {
            exchange,
            timestamp: Date.now(),
            result
        };

        secret_reporting_api.send( packet );

    }, config.frequency )



})();
