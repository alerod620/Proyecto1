const {Router} = require('express');
const router = Router();

router.get('/',(req,res)=>{
    const data = {
        "saludo":"hola mundo"
    };
    res.json(data);
});

module.exports =  router;