
// A list of exchange GET endpoints to sample

// Test to snatch 5 levels of the orderbook, except where noted

module.exports = {

    bitmex:                 'https://www.bitmex.com/api/v1/orderBook/L2?symbol=XBTUSD&depth=5',
    'binance-futures':      'https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=5',
    ftx:                    'https://ftx.com/api/markets/BTC-PERP/orderbook?depth=5',
    deribit:                'https://www.deribit.com/api/v2/public/get_order_book?depth=5&instrument_name=BTC-PERPETUAL',
    okex:                   'https://www.okex.com/api/swap/v3/instruments/BTC-USDT-SWAP/depth?size=5',
    'bybit-inverse':        'https://api.bybit.com/v2/public/orderBook/L2?symbol=BTCUSD&depth=5',
    coinbase:               'https://api.pro.coinbase.com/products/BTC-USD/book?level=1',                                       // Just a quote, not 5 levels

}