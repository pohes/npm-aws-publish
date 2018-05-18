#!/usr/bin/env node

'use strict'

const console = require('console')
const ElasticBeanstalkDeployment = require('../lib/eb/ElasticBeanstalkDeployment')
const LambdaDeployment = require('../lib/lambda/LambdaDeployment')

function logDone(res) {
  console.log(res)
  console.log("*** SUCCESS ****")
}

function ebServiceInstance(argv) {
  return new ElasticBeanstalkDeployment(argv.region, `${process.cwd()}/${argv.config}`, argv.description)
}

function lambdaServiceInstance(argv) {
  return new LambdaDeployment(argv.region, `${process.cwd()}/${argv.config}`, argv.description)
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
      await elasticBeanstalkDeployment.publishNewVersion(`${process.cwd()}/${argv.zip}`, argv.version_label)
      let environmentDescription = await elasticBeanstalkDeployment.createAndCheckEnvironment(argv.version_label)
      logDone(environmentDescription)
    })
  .command('eb-commit'
    , 'Swap URLS between environments and terminate the old environment'
    , (yargs) => defaultOptions(yargs)
    , async (argv) => {
      let environmentDescription = await ebServiceInstance(argv).commit()
      logDone(environmentDescription)
    })
  .command('eb-swap'
    , 'Swap URLS between 2 existing environments'
    , (yargs) => defaultOptions(yargs)
    , async (argv) => {
      let environmentDescription = await ebServiceInstance(argv).swapEnvironments()
      logDone(environmentDescription)
    })
  .command('eb-terminate-non-active'
    , 'Terminate the non active environment'
    , (yargs) => defaultOptions(yargs)
    , async (argv) => {
      let environmentDescription = await ebServiceInstance(argv).terminateNonActiveEnvironment()
      logDone(environmentDescription)
    })
  .command('lambda-publish'
    , 'publish the lambda function'
    , (yargs) => defaultOptions(yargs).demandOption('zip').default('zip', process.env.npm_package_awsPublish_zip)
      .default('publish', false).boolean('publish')
    , async (argv) => {
      let environmentDescription = await lambdaServiceInstance(argv).publishNewVersion(`${process.cwd()}/${argv.zip}`, argv.publish)
      logDone(environmentDescription)
    })
  .demandCommand(2)
  .help()
  .argv



