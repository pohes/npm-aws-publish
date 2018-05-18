const AWS = require('aws-sdk')

// Set the region

class LambdaDeployment extends require('../AWSDeployment') {

  constructor(region, config, description) {
    super(region, config, description)
    this.lambda = new AWS.Lambda()
  }

  async createNew(zipPath, publish) {
    console.log("****function don't exist, creating ...")
    this.deploymentConfig.Publish = publish
    this.deploymentConfig.Code = {ZipFile: require('fs').readFileSync(zipPath)}
    let createResult = await this.lambda.createFunction(this.deploymentConfig).promise()
    console.log("****** CREATE FUNCTION RESULT : ")
    console.log(createResult)
    console.log("****** NEW VERSION ID IS : " + createResult.Version)
  }

  async publishNewVersion(zipPath, publish) {
    this.deploymentConfig.Description = this.description

    console.log("uploading : " + zipPath)
    console.log("publish : " + publish)

    try {
      let configResult = await this.lambda.updateFunctionConfiguration(this.deploymentConfig).promise()
      if (configResult) {
        let codeResult = await this.lambda.updateFunctionCode({
          FunctionName: this.deploymentConfig.FunctionName,
          Publish: publish,
          ZipFile: require('fs').readFileSync(zipPath)
        }).promise()
        console.log("****** UPLOAD CODE RESULT : ")
        console.log(codeResult)
        console.log("****** UPLOAD CONFIG RESULT : ")
        console.log(configResult)
        console.log("****** NEW VERSION ID IS : " + codeResult.Version)
      }
    } catch (err) {
      if (err.code === 'ResourceNotFoundException') {
        await this.createNew(zipPath, publish)
      } else {
        if (err) console.log(err, err.stack) // an error occurred
      }
    }
  }
}

module.exports = LambdaDeployment