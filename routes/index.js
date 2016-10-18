var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var NoTimeTable = require('../models/notimetable')
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: '首页'});
});

router.get('/timetable', function (req, res) {
    var token = req.query['token'];
    if (typeof token == "undefined" || token == "") {
        res.render('timetable', {
            error: '链接失效或不存在'
        });
    } else {
        NoTimeTable.getByToken(token, function (err, result) {
            if (err) {
                console.log("timetable get err");
                console.log(err);
                res.render('error', {
                    error: err
                });
            }
            console.log(result);
            if (result) {
                res.render('timetable', {
                    timetable: result
                });
            } else {
                res.render('timetable', {
                    error: '链接失效或不存在'
                });
            }
        });
    }
});

router.get('/notimetable', function (req, res) {

    NoTimeTable.getUrl(req.session.user.name, function (err, result) {
        if (err) {
            console.log("notimetable get err");
            console.log(err);
            res.render('notimetable', {
                title: '无课表',
                error: err
            });
        }

        if (result) {
            res.render('notimetable', {
                title: '无课表',
                timetable: result
            });
        } else {
            res.render('notimetable', {
                title: '无课表',
            });
        }
    })
});


router.post('/generatorurl', function (req, res) {
    var rows = 12;
    if(req.body.rows){
       rows = 12;
    }
    var notimetable = new NoTimeTable(
        req.body.clubname,
        req.body.contact,
        req.body.phone,
        rows,
        req.session.user.name
    );

    notimetable.save(function (err, timetable) {
        if (err) {
            req.flash('error', err);
            console.log("post err");
            console.log(err);
            return res.redirect('/notimetable');
        }

        res.render('notimetable', {
            title: '无课表',
            timetable: timetable,
            success: '链接生成成功'
        });
    })

});

router.post('/notimetable/user',function (req,res) {
    var users = req.body.users;
    NoTimeTable.addUser(req.session.user.name,users,function(err){
        if (err) {
            res.json({code: 'error', message: '添加失败'})
        } else {
            res.json({code: 'success', message: '添加成功'})
        }
    });

});

router.get('/u/:user', function (req, res) {
    User.get(req.params.user, function (err, user) {
        if (!user) {
            res.flush('error', '用户不存在');
            return res.redirect('/');
        }

        Post.get(user.name, function (err, posts) {
            if (err) {
                res.flush('error', err);
                return res.redirect('/');
            }

            res.render('user', {
                title: user.name,
                posts: posts
            })
        })
    })
});

router.post('/post', checkLogin);
router.post('/post', function (req, res) {
    console.log(req.body);
    var post = new Post(
        req.body.post,
        req.session.user.name,
        new Date()
    );

    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            console.log("post err");
            console.log(err);
            return res.redirect('/');
        }
        req.flash('success', '发表成功');
        return res.redirect('/u/' + req.session.user.name);
    });

});

router.get("/reg", function (req, res) {
    res.render('reg', {title: '注册页面'});

});

router.post("/addcourse", function (req, res) {
    var name = req.body.name;
    var phone = req.body.phone;
    var courses = req.body.courses.split(",");
    var token = req.body.token;
    NoTimeTable.updateTimetable(token, name, phone, courses, function (err) {
        if (err) {
            res.json({code: 'success', message: err})
        } else {
            res.json({code: 'success', message: 'success'})
        }
    });

})

router.post('/reg', function (req, res) {
    console.log(req.body);
    //检验用户两次输入口令是否一致
    if (req.body['password-repeat'] != req.body['password']) {
        req.flash('error', '两次输入的口令不一致');
        return res.redirect('/reg');
    }

    //生成口令的散列值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');

    var newUser = new User({
        name: req.body.username,
        password: password
    });

    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
        if (user) {
            err = 'Username already exists.';
        }
        if (err) {
            req.flash('error', err);
            console.log(err);
            return res.redirect('/reg');
        }
        console.log("save");
        //如果不存在则新增用户
        newUser.save(function (err) {
            if (err) {
                req.flash('error', err);
                console.log("save err");
                console.log(err);
                return res.redirect('/reg');
            }
            req.flash('success', '注册成功');
            return res.redirect('/login');
        });

    });

});

router.get('/login', function (req, res) {
    res.render('login', {title: '登陆页面'});
});

router.post('/login', checkNotLogin)
router.post('/login', function (req, res) {
    console.log(req.body);

    //生成口令的散列值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');

    var newUser = new User({
        name: req.body.username,
        password: password
    });

    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
        if (user) {
            if (user.password == password) {
                req.session.user = newUser;
                req.flash('success', '登陆成功');
                return res.redirect('/');
            } else {
                err = 'password is errors';
            }
        } else {
            err = 'User is not exists.';
        }
        if (err) {
            req.flash('error', err);
            console.log(err);
            return res.redirect('/login');
        }
    });
});

router.get("/logout", checkLogin);
router.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
});

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', "未登入");
        return res.redirect('/login');
    }
    next();
};

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash("error", "已登入");
        return res.redirect('/');
    }
    next();
};
module.exports = router;
