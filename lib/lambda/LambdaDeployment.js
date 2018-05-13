const AWS = require('aws-sdk')
// Set the region
const lambda = new AWS.Lambda()

class LambdaDeployment extends require('../AWSDeployment') {

  constructor(region, config, zipPath, publish, description) {
    super(region, config, zipPath, description)
  }

  createNew() {
    console.log("****function don't exist, creating ...")
    this.deploymentConfig.Publish = this.publish
    this.deploymentConfig.Code = {ZipFile: require('fs').readFileSync(this.zipPath)}
    lambda.createFunction(this.deploymentConfig, (err, createResult) => {
      if (err) console.log(err, err.stack) // an error occurred
      else {
        console.log("****** CREATE FUNCTION RESULT : ")
        console.log(createResult)
        console.log("****** NEW VERSION ID IS : " + createResult.Version)
      }
    })
  }

  async publishNewVersion() {
    this.deploymentConfig.Description = this.description

    console.log("publish description : " + this.deploymentConfig.Description)
    console.log("uploading : " + this.zipPath)

    let configResult = await lambda.updateFunctionConfiguration(this.deploymentConfig).promise()
      .catch((err) => {
        if (err.code === 'ResourceNotFoundException') {
          this.createNew()
        } else {
          if (err) console.log(err, err.stack) // an error occurred
        }
      })
    if (configResult) {
      let codeResult = await lambda.updateFunctionCode({
        FunctionName: this.deploymentConfig.FunctionName,
        Publish: this.publish,
        ZipFile: require('fs').readFileSync(this.zipPath)
      })
      console.log("****** UPLOAD CODE RESULT : ")
      console.log(codeResult)
      console.log("****** UPLOAD CONFIG RESULT : ")
      console.log(configResult)
      console.log("****** NEW VERSION ID IS : " + codeResult.Version)
    }
  }
}

module.exports = LambdaDeployment