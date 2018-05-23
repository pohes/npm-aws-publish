# my-webapp
example nodejs express webapp using the npm-aws-publish to deploy the webapp to elastic beanstalk

---
## build 
The app is zipped using npm-pack-zip. I wanted to be closest to the standard npm pack. the zip is located at eb-build dir.


## deploy
The config file adds a few OptionSettings to the node js solution stack defined.
1. NodeCommand - The command used to run the webapp.
2. NodeVersion - The node version
3. NODE_ENV,PORT - Custom environment variables that will be sent to the node webapp.
4. IamInstanceProfile - This is required, and it is recommended to create a new role to the ec2 that will run the webapp which will consist the permissions needed by the webapp. 
5. CloudWatch logs configurations

for deploying the webapp :
```
npm run deploy -- --region=us-east-2 --version_label=test3
```