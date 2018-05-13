const aws = require('aws-sdk')
// Set the region
const s3 = new aws.S3()
const eb = new aws.ElasticBeanstalk()
const fs = require('fs')
const envNamePrefix = 'YagaWeb-Env-'

const envCount = 2


class AWSDeployment {
  /**
   *
   * @param region
   * @param configPath string
   * @param zipPath string
   * @param description string
   */
  constructor(region, configPath, zipPath, description) {
    if(region || configPath || zipPath) {
      throw new Error()
    }

      aws.config.update({region: region})
    this.deploymentConfig = require(configPath)
    this.zipPath = zipPath
    this.description = description
    console.log("AWS region : " + region)
    console.log("zip path : " + zipPath)
    console.log("config path : " + configPath)
    console.log("description : " + description)
  }

  async s3Upload(bucket, key) {
    return await s3.upload({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(this.zipPath)
    }).promise()
  }

}

module.exports = AWSDeployment
