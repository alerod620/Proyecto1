const aws_keys = require('../aws/aws_keys');

const { v4: uuidv4 } = require('uuid');
var AWS = require('aws-sdk');

const { Router } = require('express');
const router = Router();

const S3 = new AWS.S3(aws_keys.s3);
const ddb = new AWS.DynamoDB(aws_keys.dynamodb);
const rekognition = new AWS.Rekognition(aws_keys.rekognition);

const http = require('http');
const fs = require('fs');

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

        try {
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
                            "url": { S: filepath }
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
        } catch (error) {
            console.log(error);
        }
    } else {
        res.status(400).json({ "message": "No se pudo registrar" });
    }

});


router.post('/login', (req, res) => {
    let { user, password, extension, imagenBase64 } = req.body;

    if (imagenBase64 && extension) {

        var allData = new AWS.DynamoDB.DocumentClient(aws_keys.dynamodb);

        var params = {
            TableName: "usuarios",
            Limit: 100
        };

        allData.scan(params, onScan);

        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {

                let image = Buffer.from(imagenBase64, 'base64');
                let filename = `${uuidv4()}.${extension}`;

                //parametros para S3
                let bucketname = 'bucketfotos-grupo11';
                let folder = 'Temporal/';
                let filepath = `${folder}${filename}`;

                var uploadParamsS3 = {
                    Bucket: bucketname,
                    Key: filepath,
                    Body: image,
                    ACL: 'public-read',
                };

                S3.upload(uploadParamsS3, function async(err, dataImage) {
                    if (err) {
                        console.log('Error s3:', err);
                        res.status(400).send({ "message": "No se pudo logiar" });
                    } else {
                        console.log('Upload success at:', dataImage.Location);


                        data.Items.forEach(function (user) {
                            var urlImagen = user.url;
                            var nombreUser = user.user;

                            console.log(urlImagen);
                            console.log(filepath);

                            //objeto rekognition
                            var params = {
                                SimilarityThreshold: 80,
                                SourceImage: { /* required */
                                    S3Object: {
                                        Bucket: "bucketfotos-grupo11",
                                        Name: filepath
                                    }
                                },
                                TargetImage: { /* required */
                                    S3Object: {
                                        Bucket: "bucketfotos-grupo11",
                                        Name: urlImagen
                                    }
                                }
                            };

                            rekognition.compareFaces(params, function (err, data) {
                                if (err) {
                                    console.log(err, err.stack);
                                } else {
                                    console.log(data);
                                    res.status(200).send({ 'data': data });
                                }
                            });

                        });

                    }
                });




            }
        };
    } else if (user && password) {
        var allData = new AWS.DynamoDB.DocumentClient(aws_keys.dynamodb);

        var params = {
            TableName: "usuarios",
            Limit: 100
        };

        allData.scan(params, onScan);

        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                for (let i = 0; data.Count; i++) {
                    var endb = data.Items[i];
                    if (endb.user === user && endb.password === password) {
                        console.log(endb);
                        res.status(200).send({ 'user': `${endb.user}` });
                        return;
                    }
                }
                res.status(400).send({ 'message': 'Error de autenticacion' });

                /*
                data.Items.forEach(function (endb) {
                    console.log(endb.user == user);
                    console.log(endb.password == password);

                    
                });
                res.status(400).send({ 'message': 'Error de autenticacion' });
                */
            }
        };

    } else {
        res.status(400).send({ 'message': 'Error de autenticacion' });
    }
});

module.exports = router;