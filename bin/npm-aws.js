#!/usr/bin/env node

'use strict'

const console = require('console')
const ElasticBeanstalkDeployment = require('../lib/eb/ElasticBeanstalkDeployment')

const args = process.argv.slice(2)


const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'lambda-publish' || x === 'eb-publish' || x === 'eb-commit'
)

if (scriptIndex === -1) {
  console.log('USAGE: npm-aws <command> <region> [parameters]')
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

switch (script) {
  // case 'build':
  // case 'lambda-publish': {
  //
  //   break
  // }
  case 'eb-publish': {
    let elasticBeanstalkDeployment
    try {
      elasticBeanstalkDeployment = new ElasticBeanstalkDeployment(args[0], require(configPath), args[1], zipPath, args[2])
    } catch (e) {
      console.log('USAGE: aws-publish <region> <versionLabel> [description]')
      process.exit(1)
    }
    elasticBeanstalkDeployment.publishNewVersion()
      .then(() => elasticBeanstalkDeployment.createEnvironment())
    break
  }
  case 'eb-commit': {

    break

  }
  default:
    console.log('Not yet supported script "' + script + '".')
    break
}


