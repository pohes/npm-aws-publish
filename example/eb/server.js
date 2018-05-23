const express = require('express')
const app = express()
const config = require('config')
const AWS = require('aws-sdk')
AWS.config.update({region: config.get('DEFAULT_REGION')})




const router = express.Router()

app.use(require('./controllers/simpleCtl')(router))


module.exports = app
