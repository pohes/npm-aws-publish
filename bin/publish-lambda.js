#!/usr/bin/env node

'use strict';

const console = require('console');
const {publishLambda} = require('../index');

let args = process.argv.slice(2);

if (args.length <= 2) {
    let description = args.length >= 1 ? args[0] : "";
    let publish = args.length >= 2 ? args[1] === "true" : false;

    let configPath = process.env.npm_package_lambda_configPath ?
        process.cwd() + "/" + process.env.npm_package_lambda_configPath
        : process.cwd() + "/config.json";

    let zipPath = process.env.npm_package_lambda_zipPath ?
        process.cwd() + "/" + process.env.npm_package_lambda_zipPath
        : process.cwd() + "/" + process.env.npm_package_name + ".zip";

    console.log("config path : " + configPath);
    console.log("zip path : " + zipPath);
    console.log("description : " + description);
    console.log("publish : " + publish);
    publishLambda(require(configPath), zipPath, description, publish);
} else {
    console.log('USAGE: publish-lambda [description] [publish]');
    process.exit(1);
}