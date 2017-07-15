var express = require("express");
var app = express();

//引进about数据
let aboutData = require("./lib/fortune.js");

//引入模板引擎
let handles = require("express3-handlebars").create({"defaultLayout":"main"});
//设置模板引擎
app.engine('handlebars',handles.engine);
app.set('view engine', 'handlebars');

//设置静态目录
app.use(express.static(__dirname + "/public"));

//设置端口
app.set("port",process.env.PORT || 3000);

app.use(function(req, res, next) {
    res.locals.showTests = app.get("env") !== "production" && 
    req.query.test ==="1";
    next();
});

//配置路由
app.get("/",function(req,res) {
    res.render("home");
})
app.get('/about', function(req, res) {
    res.render("about",{
        aboutData:aboutData.forune(),
        pageTestScript:"./qa/test-about.js"
    })
});

app.use(function(req, res, next) {
    res.type("text/html");
    res.status("404");
    res.send("<h1 style='text-align:center;color:#ff0000'>没有找到相关页面！</h1>");
});

//监听端口
app.listen(app.get("port"), function() {
    console.log('App listening on port 3000!');
});