var express = require('express'); 
var router = express.Router();

const weekday=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// create the time string
function CreateTimeStr(){
    var timeString = "";
    var currentDate = new Date();
    var hours = String(currentDate.getHours());
    var minutes = String(currentDate.getMinutes());
    var seconds = String(currentDate.getSeconds());
	
    if(hours.length < 2){
        hours = "0" + hours;
    }
    if(minutes.length < 2){
        minutes = "0" + minutes;
    }
    if(seconds.length < 2){
        seconds = "0" + seconds;
    }
    var timeString = hours+":"+minutes+":"+seconds+" "+weekday[currentDate.getDay()]+
                        " "+month[currentDate.getMonth()]+" "+currentDate.getDate()+
                        " "+currentDate.getFullYear();
    return timeString;
}

// compare two time strings
function TimeCompare(a, b){
    a_list = a.split(" ");
    b_list = b.split(" ");
    if(a_list[4] != b_list[4]){
        if(a_list[4] > b_list[4]){
            return true;
        } else return false;
    } else if(a_list[2] != b_list[2]){
        a_month = month.indexOf(a_list[2]);
        b_month = month.indexOf(b_list[2]);
        if(a_month > b_month){
            return true;
        } else return false;
    } else if(a_list[3] != b_list[3]){
        if(parseInt(a_list[3]) > parseInt(b_list[3])){
            return true;
        } else return false;
    } else if(a_list[0] != b_list[0]){
        if(a_list[0] > b_list[0]){
            return true;
        } else return false;
    } else return true;
} 

// handle Signin 
router.post('/signin', function (req, res) {
	var db = req.db;
    var user_collection = db.get('userList');
    var comment_collection = db.get('commentList'); 
    var post_collection = db.get('postList');
	var username = req.body.username;
	var password = String(req.body.password);
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
	
	// find the user according to the username
	user_collection.find({'name':username},{},function(err,login_user){
		if(err===null){
            // if the password is correct, set the cookie of userId
			if((login_user.length>0)&&(login_user[0].password===password)){
                var id=login_user[0]._id;
                res.cookie('userId', id);
				
                var friend_list = [];
                var friend_info = {};
                var icon = login_user[0].icon;
                var friend_id_list = login_user[0].friends.map(function(objectItem){return objectItem.friendId;});
                
                // retrieve user and friends' information
                user_collection.find({'_id': {$in: friend_id_list}}, {}, function(err2, friends){
                    if (err2 === null){
                        // retrieve posts of friends
                        post_collection.find({'userId': {$in:friend_id_list}},{}, function(err3, posts){
                            if(err3 === null){
                                var posts_id = posts.map(function(objectItem){return objectItem._id.toString();});
                                // retrieve comments of the posts
                                comment_collection.find({'postId': {$in:posts_id}}, {}, function(err4, comments){
                                    if(err4 === null){
                                        for(var index in friends){
                                               var i = friend_id_list.indexOf(friends[index]._id.toString());                                        
                                               friend_info = {'name':friends[index].name,'_id':friends[index]._id, 'icon':friends[index].icon,'starredOrNot':login_user[0].friends[i].starredOrNot};
                                               
											   var friend_posts = [];
                                               for(var j=0; j < posts.length; j++){
                                                    if (posts[j].userId.toString() === friends[index]._id.toString()){
                                                        friend_post = {'_id':posts[j]._id.toString(),'time':posts[j].time,'location':posts[j].location,'content':posts[j].content};
                                                        
														var friend_comments = [];
                                                        for(var k=0; k < comments.length; k++){
                                                            if(comments[k].deleteTime != ""){
                                                                continue;
                                                            }
															
                                                            if(comments[k].postId.toString() === friend_post._id
                                                                && (friend_id_list.includes(comments[k].userId)||comments[k].userId === id.toString())){
                                                                var comment_name = "";
                                                                // Get name of the user who posts this comment
																if (comments[k].userId === id.toString())
																	comment_name = login_user[0].name;
																else{
                                                                	for(var usr_index in friends){
                                                                    	if (comments[k].userId === friends[usr_index]._id.toString()){
                                                                       		comment_name = friends[usr_index].name;
                                                                        	break;
                                                                    	}																	
                                                                	}
																}
																 
                                                                friend_comment = {'_id':comments[k]._id,'name':comment_name,'postTime':comments[k].postTime,'comment':comments[k].comment};
                                                                friend_comments.push(friend_comment);
                                                            }
                                                        }
                                                        friend_posts.push({'post':friend_post, 'comments':friend_comments});
                                                    }
                                                }
                                                friend_list.push({'friend':friend_info,'posts':friend_posts});
                                        }

                                        var current_time = CreateTimeStr();
                                        // update the "lastCommentRetrievalTime" of the user 
                                        user_collection.update({'_id':id},{$set:{'lastCommentRetrievalTime':current_time}},function(err5, docs){
                                            if(err5 === null){
                                                // send the response back to user
                                                res.json({'message':'Login Success!', 'data':friend_list,
                                                'login_usr':{'name':username,'icon':icon}});
                                            } else res.send(err5);
                                        })
                                        
                                    } else res.send(err4);
                                });
                            }else res.send(err3);
                        });
                    } else res.send(err2);
                });
			}else res.send("Login failure!");
		}else res.send(err);
	});
});

// handle logout
router.get('/logout',function(req,res){
    var db = req.db;
    var collection = db.get('userList'); 
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    // clear the "lastCommentRetrievalTime" of the user
    collection.update({'_id':req.cookies.userId}, {$set:{"lastCommentRetrievalTime":""}}, function(error, result){
        if(error === null){
            // clear cookie and send empty string back
            res.clearCookie('userId');
            res.send("");
        }
        else{
            console.log("error");
            res.send(error);
        }
      });
});

// handle getuserprofile
router.get('/getuserprofile',function(req,res){
    var db = req.db;
    var collection = db.get('userList'); 
    var id = req.cookies.userId;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    // retrieve the information of the user
	collection.find({'_id':id},{},function(error, user){
        if(error === null){
            // send the profile back to user
            res.json({
                'mobileNumber':user[0].mobileNumber,
                "homeNumber": user[0].homeNumber,
                "address": user[0].address
            })
        } else{
            res.send(error);
        }
    })
});

// handle saveuserprofile
router.put('/saveuserprofile',function(req,res){
    var db = req.db;
    var collection = db.get('userList'); 
    var id = req.cookies.userId;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    // update the information of the user
	collection.update({'_id':id},{$set:req.body},function(error, user){
        if(error === null){
            res.send("");
        } else{
            res.send(error);
        }
    })
});

// handle updatestar
router.get('/updatestar/:friendid',function(req,res){
    var db = req.db;
	var collection = db.get('userList'); 
    var friendid = req.params.friendid;
    var id = req.cookies.userId;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    // retrieve the information of current user
    collection.find({'_id':id},{},function(error,user){
        if(error === null){
            var friends = user[0].friends;
            var newStar;
            // update the starredOrNot according to friendid
            for(var index in friends){
                if(friends[index].friendId === friendid){
                    if(friends[index].starredOrNot === "Y"){
                        newStar = "N";
                    } else newStar = "Y";
                    break;
                }
            }
            // update the database
            collection.update({'_id':id,'friends.friendId':friendid},
                {$set:{'friends.$':{friendId:friendid, starredOrNot:newStar}}},function(error2, user){
                if(error2 === null){
                    res.send("");
                } else{
                    res.send(error2);
                }
            })
        }else res.send(error);
    })
});

// handle postcomment
router.post('/postcomment/:postid',function(req,res){
    var db = req.db;
    var comment_collection = db.get('commentList'); 
    var postid = req.params.postid;
    var id = req.cookies.userId;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    var comment = req.body.comment;
    var postTime = CreateTimeStr();
    var new_comment = {
        'postId':postid,
        'userId': id,
        'postTime':postTime,
        'comment':comment,
        'deleteTime':""
    }
    comment_collection.insert(new_comment,function(error,docs){
        if(error === null){
            res.send("");
        } else res.send(error);
    })
});

// handle deletecomment
router.delete('/deletecomment/:commentid',function(req,res){
    var db = req.db;
	var collection = db.get('commentList'); 
	var commentid = req.params.commentid;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    var deleteTime = CreateTimeStr();
    collection.update({'_id':commentid},{$set:{'deleteTime':deleteTime}},function(error, docs){
        if(error === null){
            res.send("");
        } else{
            res.send(error2);
        }
    });
});

// handle loadcommentupdates
router.get('/loadcommentupdates',function(req,res){
    var db = req.db;
    var user_collection = db.get('userList'); 
    var comment_collection = db.get('commentList'); 
    var post_collection = db.get('postList');
    var id = req.cookies.userId;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        'Access-Control-Allow-Credentials': 'true'
    });  
    
    // retrieve the information of the user
    user_collection.find({'_id':id},{},function(err,login_user){
        if(err===null){                
            var lastCommentRetrievalTime = login_user[0].lastCommentRetrievalTime;

            var friend_comments_after = [];
            var friend_comments_delete = [];
            var friend_id_list = login_user[0].friends.map(function(objectItem){return objectItem.friendId;});
            
            // retrieve the information of user and friends
            user_collection.find({'_id': {$in: friend_id_list}}, {}, function(err2, friends){
                if (err2 === null){
                    // retrieve the posts of friends
                    post_collection.find({'userId': {$in:friend_id_list}},{}, function(err3, posts){
                        if(err3 === null){
                            var posts_id = posts.map(function(objectItem){return objectItem._id.toString();});
                            // retrieve the comments of the posts
                            comment_collection.find({'postId': {$in:posts_id}}, {}, function(err4, comments){
                                if(err4 === null){
                                    for(var index in friends){
                                        for(var j=0; j < posts.length; j++){
                                            if (posts[j].userId.toString() === friends[index]._id.toString()){
                                                var friend_post_id = posts[j]._id.toString();
                                                for(var k=0; k < comments.length; k++){
                                                    if(comments[k].postId.toString() === friend_post_id && 
                                                        (friend_id_list.includes(comments[k].userId)||
                                                        comments[k].userId === id.toString())){
                                                        var comment_name = "";
                                                        // Get name of the user who posts this comment
														if (comments[k].userId === id.toString())
															comment_name = login_user[0].name;
														else{
                                                        	for(var usr_index in friends){
                                                            	if (comments[k].userId === friends[usr_index]._id.toString()){
                                                                	comment_name = friends[usr_index].name;
                                                                	break;
                                                            	}
                                                        	}    
														}
                                                        
                                                        var friend_comment = {'_id':comments[k]._id,'name':comment_name,'postTime':comments[k].postTime,'comment':comments[k].comment, 'postId':comments[k].postId};
                                                        if(comments[k].deleteTime === ""){
                                                            if(TimeCompare(comments[k].postTime, lastCommentRetrievalTime)){                                                                        
                                                                friend_comments_after.push(friend_comment);
                                                            }
                                                        } else if(TimeCompare(comments[k].deleteTime, lastCommentRetrievalTime)){
                                                            friend_comments_delete.push({'_id':comments[k]._id});
                                                        }
                                                    }
                                                }
                                            }
                                        }                                        
                                    }
									
                                    var current_time = CreateTimeStr();
                                    user_collection.update({'_id':req.cookies.userId},{$set:{'lastCommentRetrievalTime':current_time}},function(err5, docs){
                                        if(err5 === null){
                                            res.json({'new_comments':friend_comments_after, 
                                            'delete_comments':friend_comments_delete});
                                        } else res.send(err5);
                                    })
                                } else res.send(err4);
                            });
                        }else res.send(err3);
                    });
                } else res.send(err2);
            });
        }else res.send(err);
    });
    
});


/*
 * Handle preflighted request
 */
router.options("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.send(200);
});


module.exports = router;
