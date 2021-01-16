
# Quick Development Guide for WebApps

_"A problem shared is a problem halved"_

But if I may; _a problem recursively subdivided is software engineering_

Taking the latency tool I wrote as an example (https://latency.azidyn.com) we'll go through step by step how to build something like this in a hurry.

## Step 1
Clearly define the problem and state goals. Important for not losing track during dev. Takes 5-10 minutes to do this and saves hours of tangential meandering.

Problem & Goals:
We want a web-based tool/app to measure, display and compare the response latency from trading exchanges. Ideally, we'd like to display this data visually and keep a record of some history. We'd also like to measure from different geographic regions and see how that stacks up too.

![app](https://raw.githubusercontent.com/azidyn/tachyoff/master/images/latency-shot.png "Application")


## Step 2.

Break the problem into macro components

I identify three;

1. "Client": A website thing that display our measurements visually to the user

2. "Drone": A very simple program that runs in the background somewhere which continually makes http requests to exchanges and makes a note of the response latency for each

3. "Server(s)": To do two things: 1) Collect, store and serve the data measured from above and 2) serve the website/app (in many cases this is just an html file, javascript, images etc. and the least complicated part of this)

Why do we need these three pieces?

- You can't make http requests from or persist data inside a browser typically, so that creates a need for a client/server split (a server is free to make requests to anything and has persistent disk/ssd storage ofc)

- We want our "Drone" to measure from specific and consistent geo locations anyway; not wherever the user is browsing from.



![arch](https://raw.githubusercontent.com/azidyn/tachyoff/master/images/latency-arch-digram.png "Architecture")


Step 3. Identify each component's Critical Function AKA the bare minimum to make this a complete system

**Client**: must make a request to our Server to get the latest data then display it on the page or the browser console. We can just refresh the page to see updates for now.

**Drone**: must make a single request to one exchange, measure latency then write the result to our server

**Server**: must take the Drone's report and append it to a JSON file. Just return the JSON file when the Client asks for latest data

If you get the above running, finishing the product is basically a formality of embellishing and swapping out these basic parts for advanced parts.

## Step 4

Build.

### The Drone

Alright let's get going, code here: https://github.com/azidyn/tachyoff

Very simple, here's what it does. I have a list of public endpoints (`exchanges.js`) for all the major exchanges. Endpoints just means urls you send or receive data from.

The complete code is an infinite loop.
```
For each iteration of the loop we;
	Start with a blank list of 'results'
	Measure the latency from exchange_A => add to the 'results'
	Measure the latency from exchange_B => add to the 'results'
	...
	Measure the latency from exchange_Z => add to the 'results'

	Transmit our 'results' to our server to store
	Discard the results and repeat ad infinitum
``

Takes about 20-30 seconds to complete each time. Are there better ways to do this? Yes. But will this do? Also yes.

I use the standard `request` package to measure latency. When making the request you can pass the `time: true` option and it will return fairly detailed measurements about each stage of the request: https://github.com/request/request#requestoptions-callback

For a good test, I picked the endpoints that return a portion of the live orderbook. Why this? Heavy traffic websites typically have layers of very aggressive caching to reduce internal load. Sometimes this caching may just be for a few seconds but it can give us the wrong impression about current performance. A request for an orderbook plunges your fist deep into the exchange's guts and they cannot cache this data. It's likely a true test.

The Drone has a small piece of code that `POST`s the result to my Server in London. For security, the London server rejects data from any source other than the IP addresses of my Drones.

The Server

Tools Used
	- Node
	- Express
	- Express Compression

I'm using Express to create an http server with a `POST` endpoint to receive the Drone data and a `GET` endpoint for the Client. Takes 1 min to setup.

Data storage. If you want something more industrial grade i.e. support lots of users, support advanced querying/analysis of the data, large data history; use a database/cloud queries . I don't need any of these things so I'm just using a simple JSON file to store the data locally on my server. 

We can always swap this part out later. Don't use a sledgehammer to crack a nut.

Here's what the Drone sends to the Server after testing each exchange, it's an array of these:

```js
{ region: 'london',
    epoch: 1610792400130,
    timestamp: '2021-01-16T10:20:00.130Z',
    exchange: 'bitmex',
    result:
     { samples: 3,
       errors: 0,
       failed: false,
       roundtrip: 104.91246666666659 } }
```

Upon receipt of `POST` data from the Drone, load the JSON file, add to the list and then trim the list to a given maximum. Can do this by time or by number of results. Then write the trimmed list back to disk/store:

```js
app.post('/report', (req, res) => {

    // Get the attached reports
    let reports = req.body;

    // Get the current 'database' (a json file)
    let db = util.getjson( config.db );

    // Add the new reports to the existing
    db = db.concat( reports );

    // // Trim reports older than 2hrs
    const earliest = Date.now() - config.max;
    db = db.filter( f => f.epoch >= earliest );

    // Re-write the fresh database
    fs.writeFileSync( config.db, JSON.stringify( db ));

    // Re-write the compressed version ( for serving to client, -87% reduction in size, before express gzip )
    fs.writeFileSync( config.dbc, JSON.stringify( compress( db ) ));

    // Tell caller all good
    res.status( 200 ).send('ok');

});
```

This JSON file can grow too big for the Client to handle, I don't want a 10 MB JSON file being downloaded by 100+ users visiting the website each time (bandwidth cost, user experience) so I'm using two stages of compression:

1. When saving the JSON file, I replace strings with lookup table references. I reduce precision of the timestamp from milliseconds to seconds etc. etc. This reduces an e.g. 2 MB file to 200KB. 

2. I enable gzip compression on the http endpoint that returns data to the Client (Express plugin). This reduces the 200KB file down to ~30-50KB. Much more acceptable!

I also keep an uncompressed version of the data for easy management each time it's appended.

The Client

Tools Used

	- Vue.js
	- uPlot 
	- BootstrapVue
 	- axios

Vue.js is awesome for building dynamic client UIs. The basic concepts are; you create 'components' and then assemble those components into a view or page. Components can be constructed from other components and/or they can be made of basic html. Each component is data driven so they have their own properties, strings, numbers, arrays whatever and they react automatically to changes in this data.

uPlot is a simple and fast charting package. While it doesn't support Vue.js directly, I can wrap it in a component, with properties to hold the latency measurements, and then repeat this component on the page for each exchange. 

Each component is concerned with only one set of measurements for one exchange and region:

Here's the component template:

```html
<template>
    <div>
        <b-row>
            <b-col><h4>{{ this.style.title }}</h4></b-col>  <!-- e.g. "Binance Futures" --> 
        </b-row>
        <b-row>
            <b-col>
                <b-badge variant="primary">Avg {{ avg.toFixed(1) }}ms</b-badge> 
                <b-badge class="text-black" variant="light">Latest {{ latest.toFixed(0) }}ms</b-badge> 
                <b-badge class="text-black" variant="warning">Worst {{ worst.toFixed(0) }}ms</b-badge>
                <b-badge class="text-black" variant="danger">{{ errors }} Errors</b-badge>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <div :id=" container_id "></div> <!-- This div is where the uPlot chart will be rendered -->
            </b-col>
        </b-row>       
    </div>
</template>
```

The Vue component has "props" passed to it from the core part of the application that contain the latency measurements. When this prop data is updated, the uPlot chart automatically redraws itself with the latest data


```js
	    // this.el == our div element in the template above
	    // this.chart.opts == styling options
	    // this.chart.data == the latency data

	    // If not created yet, create now
            if ( !this.chart.uplot )
                this.chart.uplot = new uPlot(this.chart.opts, this.chart.data, this.el); 

            this.chart.uplot.setData( this.chart.data )

```

The core part of the application is just this:

```js
    setInterval( async ()=>{
      
      this.reload();

    }, 60 * 1000)   // Query server every 60 secouds
```

And the `reload()` method:

```
	// Ask server for latest data (JSON file)
        let res = await axios.get( config.endpoint );

        let compressed = res.data;

        if ( !compressed || !Array.isArray( compressed.data ) || !compressed.data.length ) {
         
          this.servererror = true;
          return;
        }


	// Decompress data
        let samples = decompress( compressed );


	// Now pass the data to uPlot component props
```

The data is organised by region and exchange, something like this:

```
    data = {
      "london": {
        "ftx": [ 1,2,0,2,3,5 ],
        "bitmex": [ 1,2,0,2,3,5 ],
        ///etc
      },

      "singapore": {
        "ftx": [ 1,2,0,2,3,5 ],
        "bitmex": [ 1,2,0,2,3,5 ],
        ///etc
      }

      // etc
    }

```

Then we just have a `region` property which we bind to the region buttons here:

< region buttons > 

When a button is pressed we set `region = 'singapore'` and the uPlot component automatically updates itself with data from that region.


I use BoostrapVue for quick layout and styling. It's just Boostrap but wrapped in Vue components, but it's really convenient and easy to get something nice looking up and running quickly.


Putting it all together

Tools Used:
	- nginx
	- pm2 

I use Vultr.com for cloud hosting. For this latency project, I provision 3 VPS servers:

1. London to host the Server and Client and also London Drone measurements are taken from here
2. Drone in Singapore 
3. Drone in New York

Total cost ~15 to 20 USD a month. But I'm using the two of these servers for other duties also so the cost is closer to $5 for me. 

The physical London server hosts several apps and websites so I use nginx as a reverse proxy. 

What this means is; in my Vultr control panel where I manage the DNS for my domain `azidyn.com` I can add a subdomain e.g. `latency.` When someone connects to that full address the request is pushed onto my physical london server and picked up by nginx which is configured to look for this `latency` subdomain and route its traffic internally to the right project/software Server.

If you've never set this up, it sounds more complicated than it is.

I use pm2 to run the latency Server and start it to liste on a specific port nginx is configured to route the traffic to. In this case 3001.

`pm2 start server.js -- 3001`

pm2 will automatically restart the server if it crashes. I also use it for starting the Drones in NY and singapore. 

