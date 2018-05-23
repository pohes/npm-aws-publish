const config = require('config')

module.exports = function (router) {


  router.get('/hello', (req, res) => {
    res.json(config.message)
  })


  return router
}
