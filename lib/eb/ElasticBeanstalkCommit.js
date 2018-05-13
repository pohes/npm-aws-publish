const aws = require('aws-sdk')


class ElasticBeanstalkCommit {
  /**
   *
   * @param region
   * @param environmentConfigPath string
   */
  constructor(region, environmentConfigPath) {
    this.environmentConfig = require(environmentConfigPath)
    aws.config.update({region: region})
    this.eb = new aws.ElasticBeanstalk()
  }

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
    }
  }

  async terminateNonActiveEnvironment() {

    const environments = await this.getEnvironments()


    if (environments.prod === undefined && environments.pre_prod === undefined) {
      console.log('no existing environments')
    } else {


      console.log(`************ terminating environment ${environment.EnvironmentName}(${environment.EnvironmentId}): `)

      this.eb.terminateEnvironment({EnvironmentId: environments.pre_prod.EnvironmentId}, (err, data) => {
        if (err) console.error(err)
        else {
          console.log(data)
          console.log('******************* SUCCESS *****************')
        }
      })
      return
    }
  }

  /**
   *
   * @returns {Promise<{prod,pre_prod}>}
   */
  async getEnvironments() {
    const environmentsResult = await this.eb.describeEnvironments({
      ApplicationName: this.environmentConfig.ApplicationName,
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
      if (environment.CNAME.startsWith(`${this.environmentConfig.CNAMEPrefix}.`))//prod env
        currentEnvironments.prod = environment
      else
        currentEnvironments.pre_prod = environment
    }
    return currentEnvironments
  }
}

module.exports = ElasticBeanstalkCommit
