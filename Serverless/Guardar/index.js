const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient();
const ddb2 = new AWS.DynamoDB.DocumentClient();
const ddb3 = new AWS.DynamoDB();
const rekognition = new AWS.Rekognition();


exports.handler = (event, context, callback) => {
    let body = event; //test y api-rest (sin proxy) 
    const user = body.user;
    const extension = body.extension;
    const imagenBase64 = body.imagenBase64;
    const uuid = Date.now().toString();

    if (imagenBase64 && extension) {
        let image = Buffer.from(imagenBase64, 'base64');
        let filename = `${user}-${uuid}.${extension}`;

        //parametros para S3
        let bucketname = 'bucketfotos-grupo11';
        let folder = 'Fotos/';
        let filepath = `${folder}` + `${filename}`;

        var uploadParamsS3 = {
            Bucket: bucketname,
            Key: filepath,
            Body: image,
            ACL: 'public-read',
        };


        S3.upload(uploadParamsS3, function async(err, data) {
            if (err) {
                callback(err, { 'message': err });
            } else {
                
                /*
                var params_label = {
                  Image: {
                    S3Object: {
                      Bucket: 'bucketfotos-grupo11',
                      Name: filepath
                    },
                  },
                  MaxLabels: 1,
                  MinConfidence: 80
                };
                
                var etiqueta = "";
                
                rekognition.detectLabels(params_label, function(err, data){
                    if(err)
                    {
                        callback(err, null);
                    }
                    else
                    {
                        data.Labels.forEach(label => {
                            etiqueta = `${label.Name}`;
                        });
                    }
                });
                
                //GUARDAR EN LA BASE DE DATOS
                var params_album = {
                    Item: {
                        "Album": etiqueta,
                        "Foto": data.Location
                    },
                    TableName: "Album"
                };

                ddb.put(params_album, function (err, dataddb) {
                    if (err) {
                        console.log("error en en guardar nueva foto");
                        callback(err, { 'message': err });
                    } else {
                        console.log('Save success nueva foto');

                        
                    }   
                });
                */
                
                //GUARDAR EN LA BASE DE DATOS
                var paramsdb = {
                    Item: {
                        "Usuario": user,
                        "Foto": data.Location
                    },
                    TableName: "Usuario"
                };

                ddb.put(paramsdb, function (err, dataddb) {
                    if (err) {
                        console.log("error en en guardar nueva foto");
                        callback(err, { 'message': err });
                    } else {
                        console.log('Save success nueva foto');

                        
                    }   
                });
                
                //--------------------------
                //Parametros para jalar la imagen de perfil
                //----------------------------
                var params_con = {
                    TableName: "usuarios",
                    Limit: 100
                };

                ddb2.scan(params_con, onScan);

                function onScan(err, data2) {
                    if (err) {
                        console.log("error en buscar usuario");
                        console.log(err);
                    } else {
                        for (let i = 0; i < data2.Count; i++) {
                            var endb = data2.Items[i];
                            if (endb.user === user) {
                                console.log('Se encontro usuario');
                                console.log(endb.url);
                                console.log(filepath);
                                //REKOGNITION
                                var params_reko = {
                                    SimilarityThreshold: 80,
                                    SourceImage: {
                                        S3Object: {
                                            Bucket: "bucketfotos-grupo11",
                                            Name: endb.url
                                        }
                                    },
                                    TargetImage: {
                                        S3Object: {
                                            Bucket: "bucketfotos-grupo11",
                                            Name: filepath
                                        }
                                    }
                                };

                                rekognition.compareFaces(params_reko, function (err, datareko) {
                                    if (err) {
                                        console.log("error rekognition");
                                        callback(err, null);
                                    } else {
                                        try {
                                            if (datareko.FaceMatches[0].Similarity >= 80) {
                                                console.log("Si son parecidos");
                                                //INSERTAR A TABLA APARECE
                                                var params_ap = {
                                                    Item: {
                                                        "Usuario": { S: user },
                                                        "Foto": { S: data.Location }
                                                    },
                                                    TableName: "Aparece"
                                                };
                                                console.log(user)
                                                console.log(data.Location)
                                                ddb3.putItem(params_ap, function (err, data3) {
                                                    if (err) {
                                                        console.log("error en aparece");
                                                        callback(err, null);
                                                    } else {
                                                        console.log("guarde en aparece");
                                                        callback(null, { 'message': 'ddb success' });
                                                    }
                                                });
                                            }
                                        } catch (e) {
                                            callback(err, null);
                                        }
                                    }
                                });

                            }
                        }
                        console.log("error no se encontro usuario");
                    }
                };
            }
        });
    }
}
