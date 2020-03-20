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

    if (imagenBase64 && user && password) {

        let image = Buffer.from(imagenBase64, 'base64');
        let filename = `${user}-${uuidv4()}.${extension}`;

        //parametros para S3
        let bucketname = 'bucketfotos-grupo11';
        let folder = 'Usuarios/';
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
                    TableName: "usuarios"
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
                res.status(200).json({ 'message': 'registrado' });

            }
        });

    } else {
        res.status(400).json({ "message": "No se pudo registrar" });
    }

});


router.post('/login', (req, rest) => {
    let { user, password, extension, imagenBase64 } = req.body;

    if (user && imagenBase64 && extension && (password || password == null)) {
        console.log(user + " " + extension);
    } else if (user && password && imagenBase64 == null && extension == null) {
        console.log(user + " " + password);
    } else {
        res.status(400).json({ 'message': 'Error de autenticacion' });
    }

});

module.exports = router;