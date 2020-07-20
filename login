//app.js 에서 passport를 이용해 로그인 하는 코드
//로그인&회원가입은 passport, localStrategy, session만 이용하면 충분한건지 궁금합니다. 
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.route('/login')
    .get(function (req, res, next) {
        console.log(req.flash('error'));
        if (req.user) {
            res.send('already login');
        } else {
            res.sendFile(__dirname + 'login.html');
        }
    }).post(passport.authenticate('local', {
        successRedirect: '/', // /home
        failureRedirect: '/login.html',
        failureFlash: true
    }));


// 라우팅 코드를, 이렇게 routes 폴더 안에 각각의 .js 파일로 분리해두고 app.use로 사용하는 것이 효율적인지(맞는 방법인지) 궁금합니다.
app.use('/boards', require('./routes/boards'));
app.use('/posts', require('./routes/posts'));
