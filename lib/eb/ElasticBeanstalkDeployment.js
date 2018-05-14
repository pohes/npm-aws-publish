const aws = require('aws-sdk')
const envCount = 2
const millisecondsToWait = 10000
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


class ElasticBeanstalkDeployment extends require('../AWSDeployment') {
  /**
   *
   * @param region
   * @param configPath string
   * @param description string
   */
  constructor(region, configPath, description) {
    super(region, configPath, description)

    this.envNamePrefix = `${this.deploymentConfig.ApplicationName}-Env-`

    this.eb = new aws.ElasticBeanstalk()
  }

  /**
   *
   * @param zipPath
   * @param versionLabel
   * @returns {Promise<PromiseResult<ElasticBeanstalk.ApplicationVersionDescriptionMessage, AWSError>>}
   */
  async publishNewVersion(zipPath, versionLabel) {
    const createStorageLocationResultMessage = await this.eb.createStorageLocation().promise()

    console.log(`uploading ${zipPath} version ${versionLabel} to ${createStorageLocationResultMessage.S3Bucket}`)

    let uploadResult = await this.s3Upload(createStorageLocationResultMessage.S3Bucket, versionLabel, zipPath)
    console.log(uploadResult)

    const applicationVersionResult = await this.eb.createApplicationVersion({
      ApplicationName: this.deploymentConfig.ApplicationName,
      VersionLabel: versionLabel,
      SourceBundle: {
        S3Bucket: createStorageLocationResultMessage.S3Bucket,
        S3Key: versionLabel
      }
    }).promise()
    console.log(applicationVersionResult)
    return applicationVersionResult
  }

  /**
   *
   * @param versionLabel
   * @returns {Promise<ElasticBeanstalk.EnvironmentDescription>}
   */
  async createAndCheckEnvironment(versionLabel) {
    let environment = await this.createEnvironment(versionLabel)
    return await this._waitForEnvironment(environment.EnvironmentId)
  }

  /**
   *
   * @param versionLabel
   * @returns {Promise<PromiseResult<ElasticBeanstalk.EnvironmentDescription, AWSError>>}
   */
  async createEnvironment(versionLabel) {
    const environmentsResult = await this.eb.describeEnvironments({
      ApplicationName: this.deploymentConfig.ApplicationName,
      IncludeDeleted: false
    }).promise()

    const environments = environmentsResult.Environments
    console.log(`************ Environments : `)
    console.log(environments)

    this.deploymentConfig.VersionLabel = versionLabel
    const cnameNodeActivePrefixSuffix = "-pre"

    if (environments.length > 1) {
      for (const environment of environments) {
        if (!environment.CNAME.startsWith(`${this.deploymentConfig.CNAMEPrefix}.`)) {
          this.deploymentConfig.EnvironmentName = environment.EnvironmentName
          console.log(`************ Update environment ${environment.EnvironmentName} (${environment.EnvironmentId}): `)
          delete this.deploymentConfig.CNAMEPrefix
          return await this.eb.updateEnvironment(this.deploymentConfig).promise()
        }
      }
    } else {
      if (environments.length === 0) {
        this.deploymentConfig.EnvironmentName = this.envNamePrefix + 1
      } else {
        this.deploymentConfig.CNAMEPrefix += cnameNodeActivePrefixSuffix
        const currentEnvironment = environments[0]
        //if current is 1 then 2, if current 2 then 1
        const envSuffix = parseInt(currentEnvironment.EnvironmentName.slice(-1)) % envCount + 1
        this.deploymentConfig.EnvironmentName = this.envNamePrefix + envSuffix
      }
      console.log(`************ Create environment ${this.deploymentConfig.EnvironmentName}: `)


      return await this.eb.createEnvironment(this.deploymentConfig).promise()
    }
  }

  /**
   *
   * @returns {Promise<ElasticBeanstalk.EnvironmentDescription>}
   */
  async commit() {
    let newProd = await this.swapEnvironments()
    await this._waitForEnvironment(newProd.EnvironmentId)
    await this.terminateNonActiveEnvironment()
    return newProd
  }

  /**
   *
   * @returns {Promise<ElasticBeanstalk.EnvironmentDescription>}
   */
  async swapEnvironments() {
    const environments = await this.getEnvironments()
    if (environments.pre_prod === undefined) {
      throw new Error('no existing non prod environments to swap to')
    } else if (environments.prod === undefined) {
      throw new Error('no existing prod environments to swap from')
    } else {
      await this.eb.swapEnvironmentCNAMEs({
        SourceEnvironmentId: environments.prod.EnvironmentId,
        DestinationEnvironmentId: environments.pre_prod.EnvironmentId
      }).promise()
      return environments.pre_prod
    }
  }

  /**
   *
   * @returns {Promise<PromiseResult<ElasticBeanstalk.EnvironmentDescription, AWSError>>}
   */
  async terminateNonActiveEnvironment() {
    const environments = await this.getEnvironments()
    if (environments.prod === undefined && environments.pre_prod === undefined) {
      console.log('no existing environments')
    } else {
      console.log(`************ terminating environment ${environments.pre_prod.EnvironmentName}(${environments.pre_prod.EnvironmentId}): `)
      return await this.eb.terminateEnvironment({EnvironmentId: environments.pre_prod.EnvironmentId}).promise()
    }
  }

  /**
   *
   * @returns {Promise<{prod,pre_prod}>}
   */
  async getEnvironments() {
    const environmentsResult = await this.eb.describeEnvironments({
      ApplicationName: this.deploymentConfig.ApplicationName,
      IncludeDeleted: false
    }).promise()
    let currentEnvironments = {}
    const environments = environmentsResult.Environments
    console.log(`************ Environments : `)
    console.log(environments)
    console.log('************************************')

    if (environments.length > 2) {
      console.log('has more then 2 non prod environment, terminating on of them...')
    }

    for (const environment of environments) {
      if (environment.CNAME.startsWith(`${this.deploymentConfig.CNAMEPrefix}.`))//prod env
        currentEnvironments.prod = environment
      else
        currentEnvironments.pre_prod = environment
    }
    return currentEnvironments
  }


  /**
   *
   * @param environmentId
   * @returns {Promise<ElasticBeanstalk.EnvironmentDescription>}
   * @private
   */
  async _waitForEnvironment(environmentId) {
    console.log('**** checking status')
    let params = {
      EnvironmentIds: [environmentId],
      ApplicationName: this.deploymentConfig.ApplicationName,
    }
    while (true) {
      console.log(`Waiting ${millisecondsToWait}ms until next check...`)
      await delay(millisecondsToWait)
      const environmentsResult = await this.eb.describeEnvironments(params).promise()
      let environment = environmentsResult.Environments[0]
      console.log(`${environment.EnvironmentName} (${environment.EnvironmentId}) : status -  ${environment.Status} , health - ${environment.Health}`)
      if (environment.Status !== "Launching" && environment.Status !== "Updating") {
        return environment
      }
    }
  }

}

module.exports = ElasticBeanstalkDeployment
