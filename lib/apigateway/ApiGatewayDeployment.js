const fs = require('fs')
const path = require('path')


const regRef = new RegExp(`([ \n\r]*)({)([ \n\r]*)("\\$ref")( *):( *)"[^"{}]+"([ \n\r]*)(})`, 'gm')


const AWS = require('aws-sdk')
JSON.stringify()


class ApiGatewayDeployment extends require('../AWSDeployment') {

  constructor(region, deployConfig, description) {
    super(region, deployConfig, description)
    this.apiGateway = new AWS.APIGateway()
  }

  mergeVtl(swaggerPath) {
    const doc = '' + fs.readFileSync(swaggerPath)
    return doc.replace(regRef, s => {
      try {
        let ref = JSON.parse(s).$ref
        // read the file contents.
        if (ref.endsWith('.vtl')) {
          const filePath = path.join(process.cwd(), ref)
          try {
            fs.accessSync(filePath, fs.R_OK)
          } catch (e) {
            console.error(e.message)
            return s
          }
          return JSON.stringify(fs.readFileSync(filePath) + '')
        } else {
          return s
        }
      } catch (e) {
        throw e
      }
    })
  }

  async putDefinition(swaggerPath, apiId) {

    console.log('deploying swagger : ' + swaggerPath)

    const swaggerBuffer = this.mergeVtl(swaggerPath)
    // swaggerBuffer.toString('utf8').replace("")
    if (apiId) {
      return await this.apiGateway.putRestApi({restApiId: apiId, body: swaggerBuffer}).promise()
    } else {
      return await this.apiGateway.importRestApi({body: swaggerBuffer}).promise()
    }
  }
}


module.exports = ApiGatewayDeployment
