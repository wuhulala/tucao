/**
 * Created by xueaohui on 2016/9/2.
 */
var mongodb = require('./db');

function Post(post,author,time) {
    if (time) {
        this.time = time;
    }else{
        this.time = new Date();
    }
    this.author = author;
    this.content = post;
}

module.exports = Post;


Post.prototype.save = function save(callback) {
    var post = {
        author:this.author,
        content:this.content,
        time:this.time
    };

    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }

        //
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.ensureIndex('author',function (err) {
                collection.insert(post,{safe:true},function (err,post) {
                    mongodb.close();
                    callback(err,post);
                })
            })
        })
        
    })
};

Post.get = function get(author,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            var query = {};
            if(author){
                query.author = author;
            }
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    callback(err,null);
                }
                //封装posts为Post对象
                var posts = [];
                docs.forEach(function(doc,index){
                    var post = new Post(doc.content,doc.author,doc.time);
                    posts.push(post);
                });
                callback(null,posts);
            });
        });
    });
};