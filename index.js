var express = require("express");
var app = express();
let aboutData = require("./lib/fortune.js")
let handles = require("express3-handlebars").create({"defaultLayout":"main"});
app.engine('handlebars',handles.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + "/public"));


app.set("port",process.env.PORT || 3000);
app.get("/",function(req,res) {
    res.render("home");
})
app.get('/about', function(req, res) {
    res.render("about",{aboutData:aboutData.forune()})
});

app.use(function(req, res, next) {
    res.type("text/html");
    res.status("404");
    res.send("<h1 style='text-align:center'>没有找到相关页面！</h1>");
});

app.listen(app.get("port"), function() {
    console.log('App listening on port 3000!');
});