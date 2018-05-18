const AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'us-east-1'});


function createNew(config, publish, zipPath, lambda) {
    console.log("****function don't exist, creating ...");
    config.Publish = publish;
    config.Code = {ZipFile: require('fs').readFileSync(zipPath)};
    lambda.createFunction(config, function (err, createResult) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log("****** CREATE FUNCTION RESULT : ");
            console.log(createResult);
            console.log("****** NEW VERSION ID IS : " + createResult.Version)
        }
    });
}

function publishLambda(config, zipPath, description, publish) {
    const lambda = new AWS.Lambda();
    config.Description = description;

    console.log("uploading : " + zipPath);

    lambda.updateFunctionConfiguration(config, function (err, configResult) {
            if (err) {
                if (err.code === 'ResourceNotFoundException') {
                    createNew(config, publish, zipPath, lambda);
                } else {
                    if (err) console.log(err, err.stack); // an error occurred
                }
            } else {
                lambda.updateFunctionCode({
                    FunctionName: config.FunctionName, Publish: publish, ZipFile: require('fs').readFileSync(zipPath)
                }, (err, codeResult) => {
                    if (err) console.log(err, err.stack); // an error occurred
                    else {
                        console.log("****** UPLOAD CODE RESULT : ");
                        console.log(codeResult);
                        console.log("****** UPLOAD CONFIG RESULT : ");
                        console.log(configResult);
                        console.log("****** NEW VERSION ID IS : " + codeResult.Version)
                    }          // successful response
                });
            }
        }
    )

}

function setS3TriggerConfig() {
    const s3 = new AWS.S3();

    console.log(config);
    s3.putBucketNotificationConfiguration(config, function (err, configResult) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(configResult);
            }          // successful response
        }
    );

}

function setFirehoseConfig() {
    const firehose = new AWS.Firehose();

    console.log(config);
    firehose.updateDestination(config, function (err, configResult) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(configResult);
            }          // successful response
        }
    );
}

module.exports = {
    publishLambda,
    setFirehoseConfig,
    setS3TriggerConfig,
};