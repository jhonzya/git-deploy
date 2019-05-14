var express = require('express');
var router = express.Router();

router.post('/webhook', function(req, res, next) {
    
    
    res.json({
        'text': true
    });
});

module.exports = router;
