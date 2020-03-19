const aws_keys = require('../aws/aws_keys');

const { v4: uuidv4 } = require('uuid');
var AWS = require('aws-sdk');

const { Router } = require('express');
const router = Router();

const S3 = new AWS.S3(aws_keys.s3);
const ddb = new AWS.DynamoDB(aws_keys.dynamodb);

router.get('/', (req, res) => {
    const data = {
        "saludo": "hola mundo"
    };
    res.json(data);
});

router.post('/registrar', (req, res) => {
    let { user, password, extension, imagenBase64 } = req.body;

    console.log(user);
    console.log(password);
    console.log(extension);

    if (imagenBase64 && user && password) {

        let image = Buffer.from(imagenBase64, 'base64');
        let filename = `${user}-${uuidv4()}.${extension}`;

        //parametros para S3
        let bucketname = 'bucket-grupo11-prueba';
        let folder = 'usuarios/';
        let filepath = `${folder}${filename}`;

        var uploadParamsS3 = {
            Bucket: bucketname,
            Key: filepath,
            Body: image,
            ACL: 'public-read',
        };

        S3.upload(uploadParamsS3, function async(err, data) {
            if (err) {
                console.log('Error s3:', err);
                res.status(400).send("No se pudo registrar");
            } else {
                console.log('Upload success at:', data.Location);

                //parametros de db
                var paramsdb = {
                    Item: {
                        "id": { S: uuidv4() },
                        "user": { S: user },
                        "password": { S: password },
                        "url": { S: data.Location }
                    },
                    TableName:"usuarios"
                };
                
                ddb.putItem(paramsdb, function (err, data) {
                    if (err) {
                        console.log('Error saving data:', err);
                        res.send({ 'message': 'ddb failed' });
                    } else {
                        console.log('Save success:', data);
                        res.send({ 'message': 'ddb success' });
                    }
                }); 

                res.status(200).send("Registrado");
            }
        });

    } else {
        res.status(400).send("No se pudo registrar");
    }

});


module.exports = router;