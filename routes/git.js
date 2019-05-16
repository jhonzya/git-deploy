var express = require('express');
var router = express.Router();
var moment = require('moment');
const config = require('./../config');
const actions = require('../actions');

moment.locale('es');

router.post('/webhook', (req, res, next) => {
    const repoName = req.body.repository.name;
    
    const regex = /^refs\/(heads|tags)\/(.+)$/;
    var match = regex.exec(req.body.ref);
    const ref = match[2];
    const dir = config.repos[repoName].branches[ref];
    
    var data = {
        'head': req.body.after,
        'repo': repoName,
        'started': moment().format('DD/MM/YYYY HH:mm:ss'),
        'commits': req.body.commits,
        'type': 'git',
        'target': ref
    };

    actions.deploy(dir, data);

    res.status(200);
    res.json({
        'text': 'success'
    });
});

module.exports = router;
