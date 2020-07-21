/*jslint devel: true */
/* eslint-disable no-console */
/*eslint no-undef: "error"*/
/*eslint-env node*/

var express = require('express');
var http = require('http');

var router = express.Router();
var ejs = require('ejs');
////////////////////////////////////////

var static = require('serve-static');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');

var pool = require('./database/database_loader');


//에러 헨들러 모듈 사용
var expressErrorHandler = require('express-error-handler');


var config = require('./config');
//암호화 모듈

var route_loader = require('./routes/route_loader');
var fs = require('fs');
var app = express();
console.log('config.server_port ->' + config.server_port);
app.set('port', config.server_port || 9090);
app.set('view engine', 'ejs');

/*
var PythonShell = require('python-shell');
var options = {
  mode: 'text',
  pythonPath: '/usr/bin/python',
  pythonOptions: ['-u'],
  scriptPath: '',
   args:['a']
};

*/

app.use('/', static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
    secret: 'my key',
    resave: false, // session data가 바뀌기 전까지는 session 저장소에 저장하지 않는다.
    saveuninstalized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    //    console.log('()isAuthenticated: ', req.isAuthenticated());//d
    //    console.log('(app.js - app.use) currentUser ', req.user);//d
    next();
})



passport.serializeUser(function (user, done) {
    console.log("serializeUser ", user);
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    /*db에서 id를 이용하여 user를 얻어서 done 호출*/
    //    mySqlClient.query('SELECT * FROM user_info_tb WHERE `id`=?', [id], function (err, rows) {
    pool.query('SELECT * FROM user_info_tb WHERE `id`=?', [id], function (err, rows) {
        var user = rows[0];
        console.log('deserialize ', user);
        done(err, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, function (username, password, done) { //mean]로그인할때 이 함수가 호출된다.
    pool.query('SELECT * FROM user_info_tb WHERE `id`=?', [username], function (err, rows) {
        var user = rows[0];
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, {
                message: 'Incorrect username.'
            });
        }
        if (user.pw != password) {
            //if(!user.validPassword(password)){
            return done(null, false, {
                message: 'Incorrect password.'
            });
        }
        return done(null, user);
    });
}));

app.route('/login')
    .get(function (req, res, next) {
        console.log(req.flash('error'));
        if (req.user) {
            res.send('already login');
        } else {
//            res.sendFile(__dirname + '/public/login.html');
            res.render('login2', {
                error: req.flash('error')
            });
        }
    }).post(passport.authenticate('local', {
        successRedirect: '/', // /home
        failureRedirect: '/login',
        failureFlash: true
    }));

app.route('/logout').get(function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    })
})


app.get('/', function (req, res) {

    console.log(req.expressSession);
    var sql = "SELECT t_list_tb.t_name, t_list_tb.t_code, t_list_tb.addr, t_status_tb.sanitary, t_status_tb.supply, t_status_tb.safety FROM t_list_tb INNER JOIN t_status_tb ON t_list_tb.t_code = t_status_tb.t_code WHERE t_status_tb.stall_no=1;";
    pool.query(sql, (err, rows, fields) => {
        if (err) {
            console.log(err);
        } else {
            res.render('main', {
                datas: rows
            });
            console.log("app.js get 실행됨")
            //res.send('menu_list', {datas: rows});
        }
    });
    //    res.render('main'); 
});

route_loader.init(app, express.Router());

app.use('/boards', require('./routes/boards'));
app.use('/posts', require('./routes/posts'));

var errorHandler = expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);



/*
PythonShell.PythonShell.run('s3send.py', options, function (err,results) {
  if (err) throw err;
  console.log('results: %j', results);
});
*/

http.createServer(app).listen(app.get('port'), function () {
    console.log('익스프레스로 웹 서버를 실행함: ' + app.get('port'));

});
