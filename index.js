var express = require("express");
var app = express();

//用domain处理未捕获的错误
app.use(function (req, res, next) {
    // 为这个请求创建一个域
    var domain = require('domain').create();
    // 处理这个域中的错误
    domain.on('error', function (err) {

        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // 在 5 秒内进行故障保护关机
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);
            // 从集群中断开
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();
            // 停止接收新请求
            server.close();
            try {
                // 尝试使用 Express 错误路由
                next(err);
            } catch (err) {
                // 如果 Express 错误路由失效，尝试返回普通文本响应
                console.error('Express error mechanism failed.\n', err.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Server error.');
            }
        } catch (err) {
            console.error('Unable to send 500 response.\n', err.stack);
        }
    });
    // 向域中添加请求和响应对象
    domain.add(req);
    domain.add(res);
    // 执行该域中剩余的请求链
    domain.run(next);
});



//引入body-parse中间件
var bodyParser = require("body-parser");




//引入cookie密钥
var credentials = require('./credentials.js');

//引入cookie中间件
var cookieParser = require('cookie-parser');
app.use(cookieParser(credentials.cookieSecret));

app.use(require('express-session')());

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


//假定你在多核系统上，应该能看到一些工作线程启动了。如果你想看到不同工作线程处理不同请求的证据，在路由前添加下面这个中间件：
// app.use(function (req, res, next) {
//     var cluster = require('cluster');
//     if (cluster.isWorker) {
//         console.log('Worker %d received request',cluster.worker.id);
//     }
// });


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
require("./routers")(app)




app.use(function (req, res, next) {
    res.type("text/html");
    res.status("404");
    res.send("<h1 style='text-align:center;color:#ff0000'>没有找到相关页面！</h1>");
});
app.use(function (err, req, res, next) {
    console.error(err.stack);
    //app.status(500).render('500');
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