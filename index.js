var express = require("express");
var app = express();

var bodyParser = require("body-parser");

//引入上传文件中间件
var formidable = require('formidable');

//引进about数据
var aboutData = require("./lib/fortune.js");

//引进home数据
var homeData = require("./lib/home.js");
//引进天气数据
var getWeatherData = require("./lib/weather.js");
console.log(getWeatherData)

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
    res.render("home", homeData.homeData);
});
app.get('/about', function (req, res) {
    res.render("about", {
        aboutData: aboutData.forune(),
        pageTestScript: "./qa/test-about.js"
    });
});

app.get('/newsletter', function(req, res) {
    res.render("newsletter",{csrf: 'CSRF token goes here' });
});


app.post('/process', function(req, res) {
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    console.info(req.accepts("json,html"));
    //res.type("json");
    if(req.xhr || req.accepts("json,html") === "json"){
        res.send({success:true});
    }else{
        res.redirect(303, '/thankyou');
    }
    
});
app.get('/thankyou', function(req, res) {
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
    res.render('tours/request-group-rate',{
        submitData:params
    });
});


app.get('/contest/vacation-photo', function(req, res) {
    var now = new Date();
    res.render("contest/vacation-photo",{
        year: now.getFullYear(),month:now.getMonth()
    })
});

app.post('/contest/vacation-photo/:year/:month', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req,function(err,fields,files){
        if(err) return res.redirect(303, '/error');
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

//监听端口
app.listen(app.get("port"), function () {
    console.log('App listening on port 3000!');
});