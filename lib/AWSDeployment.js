const aws = require('aws-sdk')
// Set the region
const s3 = new aws.S3()
const fs = require('fs')


class AWSDeployment {
  /**
   *
   * @param region
   * @param configPath string
   * @param description string
   */
  constructor(region, configPath, description) {
    console.log("AWS region : " + region)
    console.log("config path : " + configPath)
    console.log("description : " + description)

    if (region === undefined || configPath === undefined) {
      throw new Error("missing required params")
    }

    aws.config.update({region: region})

    try {
      if(configPath.endsWith(".yml") || configPath.endsWith(".yaml")) {
        this.deploymentConfig = require('yamljs').parseFile(configPath)
      } else {
        this.deploymentConfig = require(configPath)
      }
    } catch (e) {
      console.warn(e.message)
    }
    /**
     * @type {string}
     */
    this.description = description

  }


  // noinspection JSMethodCanBeStatic
  async s3Upload(bucket, key, zipPath) {
    return await s3.upload({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(zipPath)
    }).promise()
  }

}

module.exports = AWSDeployment
