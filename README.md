# npm-aws-publish
Simple aws publishing tools. 
The package handles 2 common use cases :
* Web application deployment to elastic beanstalk.
* Lambda based micro service. 
---
## Elastic Beanstalk 
The eb scripts handles the common use case of green-blue deployment of a web application artifact. 
1. The package is deployed to s3 and labeled as a new deployment package (version label).
2. A new elastic beanstalk environment is created or updated(if exists) with the new deployment package or new configuration. 
3. The new environment acts as a pre prod or staging environment, so you can check the deployment of the new version.
4. Once the new version deployment is validated, it is 'committed' so it will be swapped with the existing prod version.
5. After swapping environments the old environment can be terminated.

### how to use the scripts?
#### The config file 
The web application should include a config file (json file) which defines the environment which the deployment will run in.
a sample of a config file is in the example project. 
The config file is actually the defined by the aws api for [creating a new elastic beanstalk environment](https://docs.aws.amazon.com/elasticbeanstalk/latest/api/API_CreateEnvironment.html),
the version label should not be in the config file since it is determined in deployment time as a script parameter.
```
{
   "ApplicationName": "my-webapp",
   "CNAMEPrefix": "my-webapp",
   "SolutionStackName": "64bit Amazon Linux 2018.03 v4.5.0 running Node.js",
   "OptionSettings": [
     {
       "Namespace": "aws:elasticbeanstalk:container:nodejs",
       "Value": "npm run server",
       "OptionName": "NodeCommand"
     },
     {
       "Namespace": "aws:elasticbeanstalk:container:nodejs",
       "Value": "8.11.1",
       "OptionName": "NodeVersion"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "Value": "production",
       "OptionName": "NODE_ENV"
     }
   ]
 }
 ```
This is a common config file. I will try to explain the parameters:
* ApplicationName(required) - Besides the being the elastic beanstalk application name, this field will also be a part of the new environment name.
* CNAMEPrefix(required) - This will define the prefix for the url where the environment will be available. 
after deploying the app , it will run in an environment that will be available at the url : **my-webapp-pre.{region}.elasticbeanstalk.com** the '-pre' which was added to the CNAMEPrefix means that this is not yet a production environment 
(unless there isn't a running production environment which is running available at **my-webapp.{region}.elasticbeanstalk.com**).
* SolutionStackName(required) - An aws eb environment template for different types of solutions.
 each solution stack defines a configuration template, this definition can be enriched or overridden with the **OptionSettings** field, or template options can be removed with **OptionsToRemove**. the options are as cloudformation template defines.
 
 ####run the scripts
 Once we have a config file in our project and an artifact for the webapp, we can deploy the package to a new environment :
 
 ```
 # if we installed the npm-aws-publish globbaly
 npm-aws eb-publish --config=path_to config_from_project_root --zip=path_to config_from_project_root --region=aws_region --version_label=unique_version --description=deployment_description
```
if this is a nodejs based webapp the scripts can be defined in the package.json and the zip and config path:
```
{
  "name": "my-webapp",
  "version": "0.0.1",
  "awsPublish": {
    "zip": "eb-build/my-webapp.zip",
    "config": "eb-environment.json"
  },
  "dependencies": {
  ...
  },
  "devDependencies": {
     ...
     "npm-aws-publish": "0.0.7",
     ...
  },
  "scripts": {
      "publish": "npm-aws eb-publish",
      ...
  }
}
```
and then run from the location of the package.json 

 ```
 npm run publish --region=aws_region --version_label=unique_version --description=deployment_description
```
