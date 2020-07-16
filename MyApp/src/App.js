import React from 'react';
import './App.css';
import $ from 'jquery'; 


// compare two time strings, for sorting
const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function TimeCompare(a, b){
  var a_list = a.split(" ");
  var b_list = b.split(" ");
  if(a_list[4] !== b_list[4]){
      if(a_list[4] > b_list[4]){
          return true;
      } else return false;
  } else if(a_list[2] !== b_list[2]){
      var a_month = month.indexOf(a_list[2]);
      var b_month = month.indexOf(b_list[2]);
      if(a_month > b_month){
          return true;
      } else return false;
  } else if(a_list[3] !== b_list[3]){
      if(parseInt(a_list[3]) > parseInt(b_list[3])){
          return true;
      } else return false;
  } else if(a_list[0] !== b_list[0]){
      if(a_list[0] > b_list[0]){
          return true;
      } else return false;
  } else return true;
} 

class PostsRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      star: this.props.star,
      starIcon: '',
    }
    this.submitComment = this.submitComment.bind(this);
    this.handleUpdateStar = this.handleUpdateStar.bind(this);
    this.handleDeleteComment = this.handleDeleteComment.bind(this);
  }

  componentDidMount() {
    if(this.props.star === 'Y'){
      this.setState({
        starIcon: 'icons/star.png'
      })
    } else {
      this.setState({
        starIcon: 'icons/unstar.png'
      })
    }
  }

  submitComment(e){
    var new_comment = e.target.comment.value;
    if(new_comment === ""){
      alert("Please write the comment");
    } else{
      var url = "http://localhost:3001/postcomment/"+e.target.postID.value;
      e.target.comment.value = "";

      $.ajax({
        url: url,
        method: "POST",
        data: {'comment':new_comment},
        xhrFields: {
          withCredentials: true
        },
        success:function(data){
          this.props.handleUpdateComment('add', new_comment);   
        }.bind(this),
        error:function (xhr, ajaxOptions, thrownError) {
          alert(xhr.status);
          alert(thrownError);
        }
      });
    }
    e.preventDefault();
  }

  handleUpdateStar(){
    var newStar;
    if (this.state.star === "Y"){
      newStar = "N";
      this.setState({
        starIcon: 'icons/unstar.png'
      });
    } else {
      newStar = "Y";
      this.setState({
        starIcon: 'icons/star.png'
      });
    }
	
    var id = this.props.id;
    var url = "http://localhost:3001/updatestar/" + id;
    $.ajax({
      url: url,
      method: "GET",
      data: newStar,
      xhrFields: {
        withCredentials: true
      },
      success:function(data){
        this.setState({
          star:newStar
        });
        // update state of parent component
        this.props.handleUpdateStar(id,newStar);
      }.bind(this),
      error:function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }
    });
  }

  handleDeleteComment(e){
    // get the commentid and username of the comment to be deleted
    var id = e.target.parentNode.id.substr(0,24);
    var name = e.target.parentNode.id.substr(24);
    // only send request when the username of the comment is the current user
    if(name === this.props.usrName){
      var confirmation = window.confirm("Are you sure you want to delete this comment?");
      if(confirmation === true){
        var url = "http://localhost:3001/deletecomment/" + id;
        $.ajax({
          url: url,
          method: "DELETE",
          xhrFields: {
            withCredentials: true
          },
          success:function(data){
            // delete the comment in page
            this.props.handleUpdateComment('delete',id);
          }.bind(this),
          error:function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
          }
        });
      }
    }
  }

  render(){
    const post = this.props.post;
    const comment_row = [];
    // sort the comments according to postTime
    post.comments.sort((a,b) => {
      if(TimeCompare(a.postTime, b.postTime)){
        return 1;
      } else return -1;
    })
    //create comment row 
    for(var index in post.comments){
      var comment = post.comments[index];
      var commentName = comment.name;
      if(commentName === this.props.usrName){
        commentName = "You";
      }
      const EntryId = comment._id + comment.name;
      comment_row.push(
        <tr className="commentEntry wrapper" 
        onDoubleClick={
          this.handleDeleteComment
        } id={EntryId}>
          <td className="commentTime"> {comment.postTime} </td>
          <td className="commentName">{commentName}</td>
          <td> said: </td>
          <td className="commentContent"> {comment.comment}</td>
        </tr>
      )
    }
    
    return(
      <div className="post">
        <img className="Icon" src={this.props.icon}></img>
        <div className="name">
          {this.props.name}
          <span className="star" onClick={this.handleUpdateStar}>
          <img src={this.props.starIcon} id="starIcon"></img>
          </span>
        </div>
        <span className="time">{post.post.time}</span><span>&nbsp;{post.post.location}</span>
        <div className="content">{post.post.content}</div>
        <div id="commentGroup">
          <table>
            <tbody>
            {comment_row}
            </tbody>
          </table>
        </div>
        <form onSubmit={this.submitComment}>
          <input name="postID" type="hidden" value={post.post._id} />
          <input name="comment" className="commentInput" type="text" size="40" placeholder="write your comment here..." />
        </form>
      </div>
    );
  }
}

class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date()
    };
    this.handleUpdateStar = this.handleUpdateStar.bind(this);
    this.handleUpdateComment = this.handleUpdateComment.bind(this);
  }

  handleUpdateStar(id, newStar){
    this.props.handleUpdateStar(id,newStar);
  }

  handleUpdateComment(update_method, comment){
    this.props.handleUpdateComment(update_method, comment);
  }

  render(){
    var rows = [];
    this.props.friendPosts.map((post) => {
      var name = post.friend.name;
      var id = post.friend._id;
      var icon = post.friend.icon;
      var starIcon;

      if(post.friend.starredOrNot === "Y"){
        starIcon = "icons/star.png";
      } else starIcon = "icons/unstar.png";

      for (var index in post.posts){
        // index is used for sorting
        rows.push({ 'component':
          <PostsRow
            name={name}
            id={id}
            icon={icon}
            post={post.posts[index]}
            star={post.friend.starredOrNot}
            starIcon={starIcon}
            handleUpdateStar={this.handleUpdateStar}
            handleUpdateComment={this.handleUpdateComment}
            usrName={this.props.usrName}
            key={post.posts[index].post.time}
          />,
          'index':post.posts[index].post.time
          }
        )
      }
    });
    // sort the rows according to time
    rows.sort(function(a,b){
      if(TimeCompare(a.index, b.index)){
        return 1;
      } else return -1;
    })
    // get component
    var rows_components = rows.map((object) => {
      return object.component;
    })
    
    return(
      <div id="posts">
        {rows_components}
      </div>
    );
  }
}

class FriendListRow extends React.Component {
  render(){
    const friend = this.props.friend;
    return(
      <div id="list">
        <span><img src={friend.icon} className="listImg"></img> </span>&nbsp;
        <span>{friend.name}</span>
        <br></br>
      </div>
    );
  }
}

class FriendList extends React.Component {
  render(){
    const rows = [];
    this.props.Friends.map((friend) => {
      if(friend.starredOrNot === "Y"){
        rows.push(
          <FriendListRow
            friend={friend}
          />
        )
      }
    })
    return(
      <div id="friendList">
        {rows}
      </div>
    );
  }
}

class UsrProfile extends React.Component {
  constructor(props) {
    super(props);
    this.handleProfileFormSubmit = this.handleProfileFormSubmit.bind(this);
    this.handleMobileChange = this.handleMobileChange.bind(this);
    this.handleHomeChange = this.handleHomeChange.bind(this);
    this.handleMailChange = this.handleMailChange.bind(this);
  }

  handleProfileFormSubmit(e){
    var url = "http://localhost:3001/saveuserprofile";
    var data = {
      "mobileNumber":this.props.mobileNumber,
      "homeNumber": this.props.homeNumber,
      "address": this.props.address
    };
    $.ajax({
      url: url,
      method: "PUT",
      data: data,
      xhrFields: {
        withCredentials: true
      },
      success:function(data){
        this.props.handleSaveProfile();
      }.bind(this),
      error:function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }
    });
    e.preventDefault();
  }

  handleMobileChange(e){
    this.props.handleMobileChange(e.target.value);
  }

  handleHomeChange(e){
    this.props.handleHomeChange(e.target.value);
  }

  handleMailChange(e){
    this.props.handleMailChange(e.target.value);
  }

  render(){
    return(
      <div className="userProfile">
        <div><img src={this.props.icon} className="icon" id="profileIcon"></img></div>
        <div className="profileName">{this.props.name}</div>
        <br></br>
        <form onSubmit={this.handleProfileFormSubmit} className="profileForm">
          <p className="login_text">Mobile &thinsp; number &nbsp;</p>
          <input className="formInput"
              type="text"
              value={this.props.mobileNumber}
              onChange={this.handleMobileChange}
          />
          <br/>
          <br/>
          <p className="login_text">  Home &nbsp; number &nbsp;</p>
          <input className="formInput" id="homeInput"
              type="text"
              value={this.props.homeNumber}
              onChange={this.handleHomeChange}
          />
          <br/>
          <br/>
          <p className="login_text">  Mailing address &nbsp;</p>
            <input className="formInput" id="mailInput"
              type="text"
              value={this.props.address}
              onChange={this.handleMailChange}
            />
          <br/>
          <br/>
          <input className="formInput btn submit" id="profileSubmit"
              type="submit"
              value="Save"
          />
        </form>		 
      </div>
    );
  }
}

// login component
class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      loginfailure: ''
    }
    this.handleUserNameChange = this.handleUserNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleSigninFormSubmit = this.handleSigninFormSubmit.bind(this);
  }

  // check if the user has logged in when initialed
  componentDidMount(){
    if(localStorage.loggin === 'true'){
      this.handlePageRefresh(localStorage.usrname, localStorage.password);
    }
  }

  // if the user has logged in, directly send sigin request with stored user state
  handlePageRefresh(usrname, password){
    var url = "http://localhost:3001/signin";
    var user = {'username': usrname, 'password': password};
    $.ajax({
      url: url,
      method: "POST",
      data: user,
      xhrFields: {
        withCredentials: true
      },
      success:function(data){
        if (data.message === "Login Success!"){
          this.props.SuccessLogin(data.login_usr, data.data);
          this.setState({
            username: "",
            password: "",
            loginfailure: ''
          })
        } else{
          this.setState({
            password: ""
          })
        }
      }.bind(this),
      error:function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }
    });
  }

  handleSigninFormSubmit(e){
    if(this.state.username === "" || this.state.password === ""){
      alert("You must enter username and password!");
    } else{		
      var url = "http://localhost:3001/signin";
      var user = {'username':this.state.username,'password':this.state.password}
      // store login state for keeping state after page refreshing
      localStorage.setItem('usrname', this.state.username);
      localStorage.setItem('password', this.state.password);
	  
      $.ajax({
        url: url,
        method: "POST",
        data: user,
        xhrFields: {
          withCredentials: true
        },
        success:function(data){			
          if (data.message === "Login Success!"){
            // store login state for keeping state after page refreshing
            localStorage.setItem('loggin','true');
            this.props.SuccessLogin(data.login_usr, data.data);
            this.setState({
              username: "",
              password: "",
              loginfailure: ''				
            })
          } else{
            this.setState({
              loginfailure: "Login failure",
              password: ""
            })
          }
        }.bind(this),
        error:function (xhr, ajaxOptions, thrownError) {
          alert(xhr.status);
          alert(thrownError);
        }
      });
    }
    e.preventDefault();
  }

  handleUserNameChange(e) {
    this.setState({
      username: e.target.value
    })
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value
    })
  }

  render(){
    return(
	    <form onSubmit={this.handleSigninFormSubmit} className="wrap-login">
        <p id="login_failure"> {this.state.loginfailure} </p>
        <p className="login_text">Username</p> 
        <input
            type="text"
            value={this.state.username}
            onChange={this.handleUserNameChange}
            className="login_input"
        />
        <br/>
        <p className="login_text">Password</p> 
        <input
            type="password"
            value={this.state.password}
            onChange={this.handlePasswordChange}
            className="login_input" id="pwd_input"
        />
        <br/> 
        <input
            type="submit"
            value="Sign in"
            className="btn submit"
        />
	    </form>
    );
  }
}

// main component
class SocialNetwork extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: false,
      showUserProfile: false,
      starredFriends: [],
      friendPosts: [],
      usrname:"",
      icon:"",
      mobileNumber: "",
      homeNumber: "",
      address: ""
    }
	
    this.SuccessLogin = this.SuccessLogin.bind(this);
    this.handleGetUsrProfile = this.handleGetUsrProfile.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleSaveProfile = this.handleSaveProfile.bind(this);
    this.handleUpdateStar = this.handleUpdateStar.bind(this);
    this.handleUpdateComment = this.handleUpdateComment.bind(this);
    this.handleLoadComments = this.handleLoadComments.bind(this);
    this.handleHomeChange = this.handleHomeChange.bind(this);
    this.handleMailChange = this.handleMailChange.bind(this);
    this.handleMobileChange = this.handleMobileChange.bind(this);
  }  

  componentWillUnmount(){
    // clear login state used for keeping state after page refreshing
    localStorage.setItem('loggin','false');

    clearInterval(this.timerID);
  }

  tickLoadComments(){
    var url = "http://localhost:3001/loadcommentupdates/";
    $.ajax({
      url: url,
      method: "GET",
      xhrFields: {
        withCredentials: true
      },
      success:function(data){
        // update page view
        this.handleLoadComments(data.new_comments, data.delete_comments);
      }.bind(this),
      error:function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }
    });
  }

  handleGetUsrProfile(){
    $.ajax({
      url:"http://localhost:3001/getuserprofile",
      method:"GET",
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        // update page view
        this.setState({
          showUserProfile: true,
          homeNumber: data.homeNumber,
          mobileNumber: data.mobileNumber,
          address: data.address
        });
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }
    });
  }

  handleSaveProfile(){
    this.setState({
      profile:{},
      showUserProfile: false,
      homeNumber: "",
      mobileNumber: "",
      address: ""
    });
  }

  handleLogout(){
    $.ajax({
      url:"http://localhost:3001/logout",
      method:"GET",
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        // clear stored user state after logout
        localStorage.setItem('loggin','false');
        localStorage.setItem('usrname','');
        localStorage.setItem('password','');
        // clear timer
        clearInterval(this.timerID);
        this.setState({
          loggedin:false,
          showUserProfile:false,
          starredFriends: [],
          friendPosts: [],
          usrname: "",
          icon:""
        });
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }
    });
  }

  // update page view and related state after successfully loggin
  SuccessLogin(usr, data){
    var friend_list = data;
    var friends = friend_list.map((friend) => {
        return friend.friend;
    });

    this.setState({
      usrname:usr.name,
      icon: usr.icon,
      starredFriends: friends,
      friendPosts: friend_list,
      loggedin: true,
      showUserProfile: false
    });
    // update timer
    this.timerID = setInterval(
      () => this.tickLoadComments(),
      3000
    );
  }
  
  // update state in main component after updateStar
  handleUpdateStar(id, newStar){
    var new_starredFriends = this.state.starredFriends;
    var new_friendPosts = this.state.friendPosts;
    for(var i in new_friendPosts){
      var friend_info = new_friendPosts[i].friend;
      if(friend_info._id === id){
        new_friendPosts[i].friend.starredOrNot = newStar;
      }
    }
    for(var index in new_starredFriends){
      if (new_starredFriends[index]._id === id){
        new_starredFriends[index].starredOrNot = newStar;
      }
    }
    this.setState({
      starredFriends: new_starredFriends,
      friendPosts: new_friendPosts
    });
  }

  // update the comment
  handleUpdateComment(update_method, comment){
    var new_friendPosts = this.state.friendPosts;
    if(update_method === "delete"){
      // find the deleted comment according to commentid
      var commentid = comment;
      for(var i in new_friendPosts){
        for(var j in new_friendPosts[i].posts){
          for(var k in new_friendPosts[i].posts[j].comments){
            var iter_comment = new_friendPosts[i].posts[j].comments[k];
            if(iter_comment._id === commentid){
              new_friendPosts[i].posts[j].comments.splice(k,1);
            }
          }
        }
      }
    } else if(update_method === 'add'){
      // directly reload the comment from server
      this.tickLoadComments();
    }
    // apply state update 
    this.setState({
      friendPosts: new_friendPosts
    })
  }
  
  // update state after loadcomments
  handleLoadComments(new_comments, delete_comments){
    var new_friendPosts = this.state.friendPosts;
    var changePosts = false;
    if(delete_comments.length > 0){
      for(var index in delete_comments){
        var commentid = delete_comments[index]._id;
        
        for(var i in new_friendPosts){
          for(var j in new_friendPosts[i].posts){
            for(var k in new_friendPosts[i].posts[j].comments){
              var iter_comment = new_friendPosts[i].posts[j].comments[k];
              if(iter_comment._id === commentid){
                new_friendPosts[i].posts[j].comments.splice(k,1);
                changePosts = true;
              }
            }
          }
        }
      }
    }

    if(new_comments.length > 0){
      for(var index in new_comments){
        var new_comment_postId = new_comments[index].postId;
        
        for(var i in new_friendPosts){
          for(var j in new_friendPosts[i].posts){
            var postId = new_friendPosts[i].posts[j].post._id;
            if(postId === new_comment_postId){
              var existingComment = false;
              for(var k in new_friendPosts[i].posts[j].comments){
                if(new_friendPosts[i].posts[j].comments[k]._id === new_comments[index]._id){
                  existingComment = true;
                  break;
                }
              }
              if(existingComment === false){
                new_friendPosts[i].posts[j].comments.push(new_comments[index]);
                changePosts = true;
              }
            }
          }
        }
      }
    }
	
    if(changePosts){
      this.setState({
        friendPosts: new_friendPosts
      })
    }
  }


  handleMobileChange(mobileNumber){
    this.setState({
      mobileNumber: mobileNumber
    });
  }

  handleHomeChange(homeNumber){
    this.setState({
      homeNumber: homeNumber
    });
  }

  handleMailChange(mailAddress){
    this.setState({
      address: mailAddress
    });
  }

  render() {
    let topNavComponent = null;
    let loginComponent = null;
    let friendListComponent = null;
    let postsComponent = null;
    let usrProfileComponent = null;
	
    if(this.state.loggedin){
      topNavComponent = (        
        <div  className="topnav">
          <span onClick={this.handleGetUsrProfile} className="left">
            <img className="NavIcon" src={this.state.icon}></img>  <span className="nav_name hov">{this.state.usrname}</span>
          </span>
          <span><button onClick={this.handleLogout} className="right log_out btn btn2">Log out</button></span>
        </div>
        );
    }
	
    if(!this.state.loggedin){
      loginComponent = (
        <Login 
        SuccessLogin={this.SuccessLogin}
        />
      );
    }
	
    if(this.state.loggedin){
      friendListComponent = (
        <FriendList 
        Friends={this.state.starredFriends}
        />
      );
    }
	
    if(this.state.loggedin && !this.state.showUserProfile){
      postsComponent = (
        <Posts 
        friendPosts={this.state.friendPosts}
        handleUpdateStar={this.handleUpdateStar}
        handleUpdateComment={this.handleUpdateComment}
        usrName={this.state.usrname}
        />       
      );
    }
	
    if(this.state.loggedin && this.state.showUserProfile){
      usrProfileComponent = (
        <UsrProfile
        handleSaveProfile={this.handleSaveProfile}
        icon={this.state.icon}
        name={this.state.usrname}
        handleHomeChange={this.handleHomeChange}
        handleMobileChange={this.handleMobileChange}
        handleMailChange={this.handleMailChange}
        mobileNumber={this.state.mobileNumber}
        homeNumber={this.state.homeNumber}
        address={this.state.address}
        />
      );
    }
    
    return (
      <div id="bodyComponent">
        {topNavComponent}
      <div id="heading">A Simple Social Network Application</div>
      <div >
        {loginComponent}
      </div>
      <div id="main">
          <div >
            {friendListComponent}
          </div>
          <div>
            {postsComponent}
          </div>
          <div id="usrProfile">
            {usrProfileComponent}
          </div>
      </div>
      </div>
    );
  }
}

export default SocialNetwork;
