var fs = require("fs");

//引进about数据
var aboutData = require("../lib/fortune.js");

//引进home数据
var homeData = require("../lib/home.js");

//引入上传文件中间件
var formidable = require('formidable');

var path = require('path');

var routers = function (app) {
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
            pageTestScript: "../public/qa/test-about.js",
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


     // 确保存在目录 data
    //var dataDir = __filename + '/data';
    var dataDir = path.resolve(__dirname, '../data')
    console.log(dataDir)
    var vacationPhotoDir = dataDir + '/vacation-photo';
    var tmpDir = dataDir + '/tmp';
    fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
    fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);
    fs.existsSync(tmpDir) || fs.mkdirSync(tmpDir);

    function saveContestEntry(contestName, email, year, month, photoPath) {
        // TODO……这个稍后再做
         //res.redirect(303, '/thankyou');
         console.log("上传成功");
    }

    app.post('/contest/vacation-photo/:year/:month', function (req, res) {
        var form = new formidable.IncomingForm();
        form.uploadDir = tmpDir;  
        form.parse(req, function (err, fields, files) {
            if (err) return res.redirect(303, '/error');
            if (err) {
                res.session.flash = {
                    type: 'danger',
                    intro: 'Oops!',
                    message: 'There was an error processing your submission. ' +
                        'Pelase try again.',
                };
                return res.redirect(303, '/contest/vacation-photo');
            }
            var photo = files.photo;

            var dir = vacationPhotoDir + '/' + Date.now();
            var path = dir + '/' + photo.name;
            fs.mkdirSync(dir);
            fs.renameSync(photo.path, dir + '/' + photo.name);
            saveContestEntry('vacation-photo', fields.email,
                req.params.year, req.params.month, path);
            req.session.flash = {
                type: 'success',
                intro: 'Good luck!',
                message: 'You have been entered into the contest.',
            };
            return res.redirect(303, '/contest/vacation-photo/entries');
        });
    });

    app.get("/contest/vacation-photo/entries", function (req, res) {
        res.render("contest/vacation-photo/entries")
    })

    app.get('/vacations', function (req, res) {
        Vacation.find({
            available: true
        }, function (err, vacations) {
            var context = {
                vacations: vacations.map(function (vacation) {
                    return {
                        sku: vacation.sku,
                        name: vacation.name,
                        description: vacation.description,
                        price: vacation.getDisplayPrice(),
                        inSeason: vacation.inSeason,
                    }
                })
            };
            res.render('vacations', context);
        });
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
    app.get('/fail', function (req, res) {
        throw new Error('Nope!');
    });

    app.get('/epic-fail', function (req, res) {
        process.nextTick(function () {
            throw new Error('Kaboom!');
        });
    });
}

module.exports = routers