const aws = require('aws-sdk')
// Set the region
const eb = new aws.ElasticBeanstalk()
const envNamePrefix = 'YagaWeb-Env-'

const envCount = 2


class ElasticBeanstalkDeployment extends require('../AWSDeployment') {
  /**
   *
   * @param region
   * @param environmentConfig {{VersionLabel,EnvironmentName,ApplicationName,CNAMEPrefix}}
   * @param versionLabel string
   * @param zipPath string
   * @param description string
   */
  constructor(region, environmentConfig, versionLabel, zipPath, description) {
    super(region, environmentConfig, zipPath, description)
    this.versionLabel = versionLabel
  }

  async publishNewVersion() {
    const createStorageLocationResultMessage = await eb.createStorageLocation()

    let uploadResult = await this.s3Upload(createStorageLocationResultMessage.S3Bucket, this.versionLabel)
    console.log(uploadResult)

    const applicationVersionResult = await eb.createApplicationVersion({
      ApplicationName: this.deploymentConfig.ApplicationName,
      VersionLabel: this.versionLabel,
      SourceBundle: {
        S3Bucket: createStorageLocationResultMessage.S3Bucket,
        S3Key: this.versionLabel
      }
    }).promise()
    console.log(applicationVersionResult)
    return applicationVersionResult
  }

  async createEnvironment() {

    const environmentsResult = await eb.describeEnvironments({
      ApplicationName: this.deploymentConfig.ApplicationName,
      IncludeDeleted: false
    }).promise()

    const environments = environmentsResult.Environments
    console.log(`************ Environments : `)
    console.log(environments)

    this.deploymentConfig.VersionLabel = this.versionLabel

    const callback = (err, data) => {
      if (err) console.error(err)
      else console.log(data)
    }
    if (environments.length > 1) {
      for (const environment of environments) {
        if (!environment.CNAME.startsWith(`${this.deploymentConfig.CNAMEPrefix}.`)) {
          this.deploymentConfig.EnvironmentName = environment.EnvironmentName
          console.log(`************ Update environment ${environment.EnvironmentName} (${environment.EnvironmentId}): `)
          delete this.deploymentConfig.CNAMEPrefix
          eb.updateEnvironment(this.deploymentConfig, callback)
        }
      }
    } else {
      if (environments.length === 0) {
        this.deploymentConfig.EnvironmentName = envNamePrefix + 1
      } else {
        delete this.deploymentConfig.CNAMEPrefix
        const currentEnvironment = environments[0]
        //if current is 1 then 2, if current 2 then 1
        const envSuffix = parseInt(currentEnvironment.EnvironmentName.slice(-1)) % envCount + 1
        this.deploymentConfig.EnvironmentName = envNamePrefix + envSuffix
      }
      console.log(`************ Create environment : `)
      eb.createEnvironment(this.deploymentConfig, callback)
    }
  }
}

module.exports = ElasticBeanstalkDeployment
