var request = require('request-promise');
var mysql = require('promise-mysql');
var RedditAPI = require('./reddit');

crawl()

function getSubreddits() {
    return request('https://www.reddit.com/.json')
        .then(response => {
            // Parse response as JSON and store in variable called result
            var result = JSON.parse(response); // continue this line

            // Use .map to return a list of subreddit names (strings) only
            return result.data.children.map(names => { 
                return names.data.subreddit;
                
            })
        });
}

function getPostsForSubreddit(subredditName) {
 
    return request('https://www.reddit.com/r/'+subredditName+'/.json?limit=50')
        .then(
            response => {
                // Parse the response as JSON and store in variable called result
                var result = JSON.parse(response); // continue this line
                return result.data.children
                    .filter(function(post) {
                        return !post.data.is_self;
                    }) // Use .filter to remove self-posts
                    .map(function (names){
                        return {
                            title: names.data.title,
                            url: names.data.url,
                            user: names.data.author
                        }
               
                    }) // Use .map to return title/url/user objects only
            }
        );
}
function getComments() {
    return request('https://www.reddit.com/r/StarWars/comments/65dbgt/the_last_jedi_teaser_poster/.json')
        .then(response => {
            // Parse response as JSON and store in variable called result
            var comments = [];
                comments[i].id = response.subString(indexOf('\"id\": \"'), 7)
        
           // Use .map to return a list of comments (strings) only
            return result[1].data.children.map(names =>{
                
                return names.data.getComments;
                
            })
        });
}

// function getCommentsForPost(postId) {
    
//     return request('https://www.reddit.com/r/'+subredditName+'/comments.jsonlimit=50?')
//         then(
//             response => {
//                 var result = JSON.parse(response);
//                 return result.data.children.data
                
//             }
//             )
// }

function crawl() {
    // create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root', // CHANGE THIS :)
        password : '',
        database: 'reddit',
        connectionLimit: 1
    });

    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);

    // This object will be used as a dictionary from usernames to user IDs
    var users = {};

    /*
    Crawling will go as follows:

        1. Get a list of popular subreddits
        2. Loop thru each subreddit and:
            a. Use the `createSubreddit` function to create it in your database
            b. When the creation succeeds, you will get the new subreddit's ID
            c. Call getPostsForSubreddit with the subreddit's name
            d. Loop thru each post and:
                i. Create the user associated with the post if it doesn't exist
                2. Create the post using the subreddit Id, userId, title and url
     */

    // Get a list of subreddits
    getSubreddits()
        .then(subredditNames => {
            subredditNames.forEach(subredditName => {
                var subId;
                myReddit.createSubreddit({name: subredditName})
                    .then(subredditId => {
                        subId = subredditId;
                        return getPostsForSubreddit(subredditName)
                    .then(posts => {
                        posts.forEach(post => {
                            var userIdPromise;
                            if (users[post.user]) {
                                userIdPromise = Promise.resolve(users[post.user]);
                            }
                            else {
                                userIdPromise = myReddit.createUser({
                                    username: post.user,
                                    password: 'abc123'
                                })
                                .catch(function(err) {
                                    return users[post.user];
                                })
                            }

                            userIdPromise.then(userId => {
                                users[post.user] = userId;
                                return myReddit.createPost({
                                    subredditId: subId,
                                    userId: userId,
                                    title: post.title,
                                    url: post.url
                                });
                            });
                        });
                    });
            });
        });
    });
}