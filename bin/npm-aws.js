#!/usr/bin/env node

'use strict'

const console = require('console')
const ElasticBeanstalkDeployment = require('../lib/eb/ElasticBeanstalkDeployment')
const LambdaDeployment = require('../lib/lambda/LambdaDeployment')
const ApigatewayDeployment = require('../lib/apigateway/ApiGatewayDeployment')

function logSuccess(res) {
  console.log(res)
  console.log("*** SUCCESS ****")
}

function fail(res) {
  console.log(res)
  console.log("*** FAIL ****")
  process.exit(1)
}

function ebServiceInstance(argv) {
  return new ElasticBeanstalkDeployment(argv.region, `${process.cwd()}/${argv.config}`, argv.description)
}

function lambdaServiceInstance(argv) {
  return new LambdaDeployment(argv.region, `${process.cwd()}/${argv.config}`, argv.description)
}

function apigatewayServiceInstance(argv) {
  return new ApigatewayDeployment(argv.region, `${process.cwd()}/${argv.config}`, argv.description)
}

function defaultOptions(yargs) {
  return yargs.demandOption(['region', 'config']).option('description')
    .choices('region', ['us-east-1', 'us-east-2'])
    .default('config', process.env.npm_package_awsPublish_config)
}

const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('eb-publish'
    , 'Deploy a app package to eb, create a staging environment for the app or update the existing staging env'
    , (yargs) => defaultOptions(yargs).demandOption(['zip', 'version_label']).default('zip', process.env.npm_package_awsPublish_zip)
    , async (argv) => {
      let elasticBeanstalkDeployment = ebServiceInstance(argv)
      await elasticBeanstalkDeployment.createApplicationIfNeeded()
      await elasticBeanstalkDeployment.publishNewVersion(`${process.cwd()}/${argv.zip}`, argv.version_label)
      let environmentDescription = await elasticBeanstalkDeployment.createAndCheckEnvironment(argv.version_label)
      if (environmentDescription.Status === 'Ready') logSuccess(environmentDescription)
      else fail(environmentDescription)
    })
  .command('eb-commit'
    , 'Swap URLS between environments and terminate the old environment'
    , (yargs) => defaultOptions(yargs)
    , async (argv) => {
      let environmentDescription = await ebServiceInstance(argv).commit()
      logSuccess(environmentDescription)
    })
  .command('eb-swap'
    , 'Swap URLS between 2 existing environments'
    , (yargs) => defaultOptions(yargs)
    , async (argv) => {
      let environmentDescription = await ebServiceInstance(argv).swapEnvironments()
      logSuccess(environmentDescription)
    })
  .command('eb-terminate-non-active'
    , 'Terminate the non active environment'
    , (yargs) => defaultOptions(yargs)
    , async (argv) => {
      let environmentDescription = await ebServiceInstance(argv).terminateNonActiveEnvironment()
      logSuccess(environmentDescription)
    })
  .command('lambda-publish'
    , 'publish the lambda function'
    , (yargs) => defaultOptions(yargs).demandOption('zip').default('zip', process.env.npm_package_awsPublish_zip)
      .default('publish', false).boolean('publish')
    , async (argv) => {
      let environmentDescription = await lambdaServiceInstance(argv).publishNewVersion(`${process.cwd()}/${argv.zip}`, argv.publish)
      logSuccess(environmentDescription)
    })
  .command('apigateway-publish'
    , 'publish the api to test'
    , (yargs) => yargs.demandOption('region').choices('region', ['us-east-1', 'us-east-2'])
      .demandOption('swagger').option('apiId')
    , async (argv) => {
      console.log(argv)
      let environmentDescription = await apigatewayServiceInstance(argv).putDefinition(`${process.cwd()}/${argv.swagger}`, argv.apiId)
      logSuccess(environmentDescription)
    })
  .demandCommand(2)
  .help()
  .argv



