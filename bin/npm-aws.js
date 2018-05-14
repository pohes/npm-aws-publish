#!/usr/bin/env node

'use strict'

const console = require('console')
const ElasticBeanstalkDeployment = require('../lib/eb/ElasticBeanstalkDeployment')

const args = process.argv.slice(2)


const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'lambda-publish' || x === 'eb-publish' || x === 'eb-commit' || x === 'eb-swap' || x === 'eb-terminate-non-active'
)

if (scriptIndex === -1) {
  console.log('USAGE: npm-aws <command> <region> [parameters]' + args)
  process.exit(1)
}
const script = scriptIndex === -1 ? args[0] : args[scriptIndex]
// const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : []

let configPath = process.env.npm_package_awsPublish_configPath ?
  process.cwd() + "/" + process.env.npm_package_awsPublish_configPath
  : process.cwd() + "/aws-publish-config.json"

let zipPath = process.env.npm_package_awsPublish_zipPath ?
  process.cwd() + "/" + process.env.npm_package_awsPublish_zipPath
  : process.cwd() + "/" + process.env.npm_package_name + ".zip"

function logDone(res) {
  console.log(res)
  console.log("*** SUCCESS ****")
}

switch (script) {
  // case 'build':
  case 'lambda-publish': {
    break
  }
  case 'eb-publish': {
    let elasticBeanstalkDeployment
    try {
      elasticBeanstalkDeployment = new ElasticBeanstalkDeployment(args[1], configPath, args[3])
    } catch (e) {
      console.error(e)
      console.log('USAGE: npm-aws eb-publish<region> <versionLabel> [description]')
      process.exit(1)
    }
    elasticBeanstalkDeployment.publishNewVersion(zipPath, args[2])
      .then(
        () => elasticBeanstalkDeployment.createAndCheckEnvironment(args[2])
          .then((res) => logDone(res))
      )
    break
  }
  case 'eb-commit': {
    let elasticBeanstalkDeployment
    try {
      elasticBeanstalkDeployment = new ElasticBeanstalkDeployment(args[1], configPath)
    } catch (e) {
      console.error(e)
      console.log('USAGE: npm-aws eb-commit <region>')
      process.exit(1)
    }
    elasticBeanstalkDeployment.commit()
      .then((res) => logDone(res))
    break

  }
  case 'eb-swap': {
    let elasticBeanstalkDeployment
    try {
      elasticBeanstalkDeployment = new ElasticBeanstalkDeployment(args[1], configPath)
    } catch (e) {
      console.error(e)
      console.log('USAGE: npm-aws eb-swap <region>')
      process.exit(1)
    }
    elasticBeanstalkDeployment.swapEnvironments()
      .then((res) => logDone(res))
    break
  }
  case 'eb-terminate-non-active': {
    let elasticBeanstalkDeployment
    try {
      elasticBeanstalkDeployment = new ElasticBeanstalkDeployment(args[1], configPath)
    } catch (e) {
      console.error(e)
      console.log('USAGE: npm-aws eb-terminate-non-active <region>')
      process.exit(1)
    }
    elasticBeanstalkDeployment.terminateNonActiveEnvironment()
      .then((res) => logDone(res))
    break
  }
  default:
    console.log('Not yet supported script "' + script + '".')
    break
}


