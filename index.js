require("dotenv").config();

const bodyParser = require("body-parser")
const path = require('path')
const express = require('express')
const app = express()

const request = require('request-promise')
const helmet = require('helmet')
const client = require('redis').createClient(process.env.REDIS_URL)
const limiter = require('express-limiter')(app, client)
const root = path.join(__dirname, 'dist')
const port = process.env.PORT || 3000
const env = process.env.NODE_ENV || 'development'

app.use(bodyParser.json())
app.use(express.static(root))
app.use(helmet())

const limiterOptions = {
	lookup: 'connection.remoteAddress',
	total: 150,
	expire: 1000 * 60 * 60,
	onRateLimited: function (req, res, next) {
		res.status(429).send({error: 'Rate limit exceeded'})
	}
}

app.get('/api/v1/posts', limiter(limiterOptions), function(req, res) {
	var options = {
		url: 'http://demo.wp-api.org/wp-json/wp/v2/posts/',
		method: 'GET',
		json: true
	}
	request(options)
		.then(function(response) {
			res.send(response)
		})
		.catch(function(e) {
			res.status(500).json({
          status: 'error'
      });
		})
})

app.listen(port, () => {
	if(env === 'development'){
		console.info('Server running on port '+port)
	}
})
