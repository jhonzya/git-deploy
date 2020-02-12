var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var _ = require('lodash');
const crypto = require('crypto');

require('dotenv').config();
const config = require('./config');

/**
 * Check repo config
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
var checkRepo = (req, res, next) => {
  // Check payload
  if(_.isEmpty(req.body)){
    res.status(400);
    return res.json({
      'msg': 'request body empty'
    });
  }

  // Check repository
  const repoName = req.body.repository.name;
  if( !(repoName in config.repos) ){
    res.status(404);
    return res.json({
      'msg': `Repo with name (${repoName}) is not configured`
    });
  }

  // Check branches
  const regex = /^refs\/(heads|tags)\/(.+)$/;
  var match = regex.exec(req.body.ref);
  if(match === null){
    res.status(404);
    return res.json({
      'msg': `Malformed ref`
    });
  }

  const ref = match[2];
  if( !(ref in config.repos[repoName].branches) ){
    return res.json({
      'msg': `Repo with name (${repoName}) and branch (${ref}) is not configured`
    });
  }

  next();
}

/**
 * Check headers
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
var checkHeaders = (req, res, next) => {
  const repoName = req.body.repository.name;
  const secret = config.repos[repoName].secret;

  if(secret){
    const headerKey = 'x-hub-signature';
    const payload = JSON.stringify(req.body);
    const headers = req.headers;
  
    const hmac = crypto.createHmac('sha1', secret);
    const digest = 'sha1=' +hmac.update(payload).digest('hex');
    const checksum = headers[headerKey];

    if(!checksum || !digest || checksum !== digest){
      res.status(400);
      return res.json({
        'msg': `Request body digest (${digest}) did not match ${headerKey} (${checksum})`
      });
    }
  }
  
  next();
}

var indexRouter = require('./routes/index');
var gitRouter = require('./routes/git');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/git', [checkRepo, checkHeaders], gitRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
