const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();


exports.handler = (event, context, callback) => {
    //let body = JSON.parse(event.body); // http-api (proxy)
    let body = event; //test y api-rest (sin proxy)
    const user = body.user;
    const tabla = body.tabla;

    var paramsDB = {
        TableName : tabla,
        KeyConditionExpression: "#user = :name",
        ExpressionAttributeNames:{
            "#user": "Usuario"
        },
        ExpressionAttributeValues: {
            ":name": user
        }
    };

    docClient.query(paramsDB, function(err, data){
        if(err) 
        {
            console.log(err);
            callback(err, null);
        }
        else
        {
            var salida = "";
            console.log(data);
            data.Items.forEach(function(item){
                salida = salida + " " + `${item.Foto}`;
            });
            callback(null, salida);
        }
    });
    
};