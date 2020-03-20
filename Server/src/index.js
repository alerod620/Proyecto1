'use strict';
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;

var cors = require('cors');

// configuraciones
app.set('port', process.env.PORT || 3000);

// middlewares
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '5mb', extended: true }));
app.use(cors());

// rutas
app.use(require('./routers/index'));

/**
 * crear las rutas de las api, que necesito
 */

// inicio de servidor
app.listen(port, () => {
    let host = 'localhost';
    console.log('API REST corriendo en http://%s:%s', host, port);
});

