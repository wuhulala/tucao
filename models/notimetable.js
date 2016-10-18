/**
 * Created by xueaohui on 2016/9/3.
 */
var crypto = require('crypto');
var mongodb = require('./db');

function NoTimeTable(name, contact, phone,rows,owner) {
    this.name = name;
    this.contact = contact;
    this.phone = phone;
    this.owner = owner;
    var md5 = crypto.createHash('md5');
    this.token = md5.update(phone).digest('base64');
    this.url = 'http://127.0.0.1:3000/timetable?token='+this.token;
    this.rows = rows
}

module.exports = NoTimeTable;

/**
 * 保存无课表
 * 
 * @param callback 回调函数
 */
NoTimeTable.prototype.save = function (callback) {
    var timetable = {
        name: this.name,
        contact: this.contact,
        phone: this.phone,
        token: this.token,
        url:this.url,
        owner:this.owner,
        rows:this.rows
    };

    console.log(timetable.url);

    mongodb.open(function (err,db) {
        if(err) {
            return callback(err);
        }

        //
        db.collection('notimetables',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.ensureIndex('phone',function (err) {
                collection.insert(timetable,{safe:true},function (err,timetable) {
                    mongodb.close();
                    callback(null,timetable.ops[0]);
                })
            })
        })
    })
};

/**
 * 获取 无课表提交页面 的 链接
 * 
 * @param owner 社团拥有者 
 * @param callback 回调函数
 */

NoTimeTable.getUrl = function (owner,callback) {
    mongodb.open(function(err,db){
        if(err){
            mongodb.close();
            return callback(err);
        }
        //读取posts集合
        db.collection('notimetables',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {
                "owner":owner
            };
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    callback(err,null);
                }
                callback(null,docs[0]);
            });
        });
    });
};

/**
 * 根据Token获取无课表提交页面
 * 
 * @param token 无课表提交令牌
 * @param callback 回调函数
 */
NoTimeTable.getByToken = function (token,callback) {
    mongodb.open(function(err,db){
        if(err){
            mongodb.close();
            return callback(err);
        }
        //读取posts集合
        db.collection('notimetables',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            var query = {};
            if(token){
                query.token = token;
            }
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    callback(err,null);
                }
                callback(null,docs[0]);
            });
        });
    });
};

/**
 * 添加和更新社团成员的课程表 
 * 
 * @param token 社团token
 * @param name 社员名称
 * @param phone 社员联系方式
 * @param courses 社员课程表
 * @param callback 回调函数
 */
NoTimeTable.updateTimetable = function(token,name,phone,courses,callback){
    var newTimetable = {
        name:name,
        phone:phone,
        courses:courses
    };

    console.log(newTimetable);

    mongodb.open(function (err,db) {
        if(err){
            mongodb.close();
            return callback(err);
        }

        db.collection('notimetables',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err,null);
            }
            var query = {
                "token":token,
                "timetables.phone":phone
            };

            console.log(query);
            var updateStr ={};


            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                if(err){
                    mongodb.close();
                    return callback(err,null);
                }

                if(docs.length == 0){
                    query = {
                        "token":token
                    };

                    updateStr = {
                        $push:{
                            "timetables":newTimetable
                        }
                    };

                    collection.update(query,updateStr,function (err,result) {
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                        mongodb.close();
                        console.log("$push ----"+result);
                        return callback(null,result);
                    })
                }else{
                    updateStr = {
                        $set:{
                            "timetables.$":newTimetable
                        }
                    };

                    collection.update(query,updateStr,function (err,result) {
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                        mongodb.close();
                        console.log("$set ----"+result);
                        return callback(null,result);
                    })
                }

            });
        })
    })

};

NoTimeTable.addUser = function (owner,user,callback) {
    mongodb.open(function (err,db) {
        if(err){
            mongodb.close();
            return callback(err);
        }

        db.collection('notimetables',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }

            var query = {
                owner:owner
            };
            
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                if(err){
                    mongodb.close();
                    return callback(err,null);
                }

                if(docs.length == 0){
                    query = {
                        "token":token
                    };

                    updateStr = {
                        $push:{
                            "timetables":newTimetable
                        }
                    };

                    collection.update(query,updateStr,function (err,result) {
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                        mongodb.close();
                        console.log("$push ----"+result);
                        return callback(null,result);
                    })
                }else{
                    updateStr = {
                        $set:{
                            "timetables.$":newTimetable
                        }
                    };

                    collection.update(query,updateStr,function (err,result) {
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                        mongodb.close();
                        console.log("$set ----"+result);
                        return callback(null,result);
                    })
                }

            });

        })
    })
}