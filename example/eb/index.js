const app = require('./server.js')
const config = require('config')
/*
 * Start server
 */
let port = config.PORT

if (process.env["PORT"]) {
  port = process.env["PORT"]
}
app.listen(port)
console.info(`my-webapp Server started on port: ${port}`)
console.info('NODE_ENV is : ' + process.env.NODE_ENV)
