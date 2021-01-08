
// A list of exchange GET endpoints to sample
// They each attempt to grab the latest 1min bar from the exchange.

module.exports = {

    bitmex:                 'https://www.bitmex.com/api/v1/trade/bucketed?binSize=1m&partial=true&symbol=XBTUSD&count=1&reverse=true',
    'binance-futures':      'https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&limit=1',
    ftx:                    'https://ftx.com/api/markets/BTC-PERP/candles?resolution=300&limit=1'

}