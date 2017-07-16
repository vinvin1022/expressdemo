var express = require("express");
var app = express();

var bodyParser = require("body-parser");

//引入上传文件中间件
var formidable = require('formidable');

//引入cookie密钥
var credentials = require('./credentials.js');

//引入cookie中间件
var cookieParser = require('cookie-parser');
app.use(cookieParser(credentials.cookieSecret));

app.use(require('express-session')());

//引进about数据
var aboutData = require("./lib/fortune.js");

//引进home数据
var homeData = require("./lib/home.js");
//引进天气数据
var getWeatherData = require("./lib/weather.js");


//引入模板引擎
var handles = require("express3-handlebars").create({
    "defaultLayout": "main"
});
//设置模板引擎
app.engine('handlebars', handles.engine);
app.set('view engine', 'handlebars');



//设置静态目录
app.use(express.static(__dirname + "/public"));

app.use(bodyParser());

//设置端口
app.set("port", process.env.PORT || 3000);


app.use(function (req, res, next) {
    // 如果有即显消息，把它传到上下文中，然后清除它
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

//测试
app.use(function (req, res, next) {
    res.locals.showTests = app.get("env") !== "production" &&
        req.query.test === "1";
    next();
});

//天气数据中间件
app.use(function (req, res, next) {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weather = getWeatherData.getWeatherData();
    next();
});


//配置路由
app.get("/", function (req, res) {
    res.cookie("islogin", "yes", {
        httpOnly: true
    });
    res.cookie("signed_monster", "monmon", {
        signed: true,
        path: "/about"
    });
    res.render("home", homeData.homeData);
});
app.get('/about', function (req, res) {
    var cookie = req.signedCookies.signed_monster;
    console.log(cookie, req.cookies);
    res.render("about", {
        aboutData: aboutData.forune(),
        pageTestScript: "./qa/test-about.js",
        cookie: cookie ? "存在cookie:" + cookie : "不存在cookie"
    });
});

app.get('/newsletter', function (req, res) {
    res.render("newsletter", {
        csrf: 'CSRF token goes here'
    });
});

app.post('/newsletter', function (req, res) {
    var name = req.body.name || '',
        email = req.body.email || '';
    // 输入验证
    console.log(email)
    if (!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) return;
        res.json({
            error: 'Invalid name email address.'
        });
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was not valid.',
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsletterSignup({
        name: name,
        email: email
    }).save(function (err) {
        if (err) {
            if (req.xhr) return;
            res.json({
                error: 'Database error.'
            });
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            }
            return res.redirect(303, '/thankyou');
        }
        if (req.xhr) return res.json({
            success: true
        });
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303, '/thankyou');
    });
});


app.post('/process', function (req, res) {
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    console.info(req.accepts("json,html"));
    //res.type("json");
    if (req.xhr || req.accepts("json,html") === "json") {
        res.send({
            success: true
        });
    } else {
        res.redirect(303, '/thankyou');
    }

});
app.get('/thankyou', function (req, res) {
    res.render("thankyou");
});


app.get('/tours/hood-river', function (req, res) {
    res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function (req, res) {
    res.render('tours/request-group-rate');
});
app.post('/tours/request-group-rate', function (req, res) {
    var params = req.body;
    res.render('tours/request-group-rate', {
        submitData: params
    });
});


app.get('/contest/vacation-photo', function (req, res) {
    var now = new Date();
    res.render("contest/vacation-photo", {
        year: now.getFullYear(),
        month: now.getMonth()
    })
});

app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thankyou');
    })
});



app.get('/header', function (req, res) {
    res.set("Content-type", "text/plain");
    var s = "";
    for (var key in req.headers) {
        if (req.headers.hasOwnProperty(key)) {
            var value = req.headers[key];
            s += key + ":" + value + "\n";
        }
    }
    res.send(s);
});

app.use(function (req, res, next) {
    res.type("text/html");
    res.status("404");
    res.send("<h1 style='text-align:center;color:#ff0000'>没有找到相关页面！</h1>");
});

switch (app.get('env')) {
    case 'development':
        // 紧凑的、彩色的开发日志
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // 模块 'express-logger' 支持按日志循环
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

//监听端口
// app.listen(app.get("port"), function () {
//     console.log('Express started in ' + app.get('env') +
//         ' mode on http://localhost:' + app.get('port') +
//         '; press Ctrl-C to terminate.');
// });


function startServer() {
    app.listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') +
            ' mode on http://localhost:' + app.get('port') +
            '; press Ctrl-C to terminate.');
    });
}
if (require.main === module) {
    // 应用程序直接运行；启动应用服务器
    console.log("------------" + require.main + "\n " + module)
    startServer();
} else {
    // 应用程序作为一个模块通过 "require" 引入 : 导出函数
    // 创建服务器
    console.log("我已经来过index了");
    module.exports = startServer;
}