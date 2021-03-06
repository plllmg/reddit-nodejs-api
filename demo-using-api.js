'use strict'

// load the mysql library
var mysql = require('promise-mysql');

// create a connection to our Cloud9 server
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root', // CHANGE THIS :)
    password : '',
    database: 'reddit',
    connectionLimit: 10
});

// load our API and pass it the connection
var RedditAPI = require('./reddit');

var myReddit = new RedditAPI(connection);
var post = {
    userId: 1, 
    title: 'testTitlePlzIgnore',
    url: 'testURLPlzIgnore.com',
    subredditId: 1
};
// var vote = {
    // userId: 1,
    // postId: 2,
    // voteDirection: 4
// }
// myReddit.createVote(vote).then(function(result){
    // console.log('Worked!!!',result)
// })

myReddit.createPost(post).then(function(result) {
     console.log(result)
})
myReddit.getAllPosts().then(function(result) {
    console.log(result)
})

myReddit.getAllSubreddits().then(function(result) {
    console.log(result)
})

myReddit.getCommentsForPost(1, 2).then(function(result) {
    console.log(result)
})


// We call this function to create a new user to test our API
// The function will return the newly created user's ID in the callback
// myReddit.createUser({
//     username: 'PM_ME_CUTES',
//     password: 'abc123'
// })
//     .then(newUserId => {
//         // Now that we have a user ID, we can use it to create a new post
//         // Each post should be associated with a user ID
//         console.log('New user created! ID=' + newUserId);

//         return myReddit.createPost({
//             title: 'Hello Reddit! This is my first post',
//             url: 'http://www.digg.com',
//             userId: newUserId
//         });
//     })
//     .then(newPostId => {
//         // If we reach that part of the code, then we have a new post. We can print the ID
//         console.log('New post created! ID=' + newPostId);
//     })
//     .catch(error => {
//         console.log(error.stack);
//     });

