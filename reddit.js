'use strict'

var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }

    createUser(user) {
        /*
        first we have to hash the password.
         */
        return bcrypt.hash(user.password, HASH_ROUNDS)
            .then(hashedPassword => {
                return this.conn.query('INSERT INTO users (username,password, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [user.username, hashedPassword]);
            })
            .then(result => {
                return result.insertId;
            })
            .catch(error => {
                // Special error handling for duplicate entry
                if (error.code === 'ER_DUP_ENTRY') {
                    throw new Error('A user with this username already exists');
                }
                else {
                    throw error;
                }
            });
    }

    createPost(post) {
        return this.conn.query('INSERT INTO posts (userId, title, url, createdAt, updatedAt, subredditId) VALUES (?, ?, ?, NOW(), NOW(), ?)', [post.userId, post.title, post.url, post.subredditId])
            .then(result => {
                return result.subredditId;
            })
             .catch(error => {
                // Special error handling for no subreddit ID
                if (error.code === 'ER_NO_SRID') {
                    throw new Error('This Subreddit does not exist');
                }
                else {
                    throw error;
                }
                });
    }

    getAllPosts(callback) {
 

        return this.conn.query(
            `
            SELECT 
                posts.id, posts.subredditId, posts.title, posts.url, posts.userId, posts.createdAt, posts.updatedAt, 
                users.username, users.createdAt AS userCreatedAt, users.updatedAt AS userUpdatedAt, 
                subreddits.id AS subredditId, subreddits.name AS subredditName, subreddits.description AS subredditDescription, 
                subreddits.createdAt AS subredditCreatedAt, subreddits.updatedAt AS subredditUpdatedAt, 
                SUM(votes.voteDirection) as voteScore
            FROM posts 
            JOIN users ON posts.userId = users.id
            JOIN subreddits ON posts.subredditId = subreddits.id
            LEFT JOIN votes ON posts.id = votes.postId
            ORDER BY voteScore, posts.createdAt DESC
            LIMIT 25`
        ).then(function(result) { 
            return result.map(function(item) { 
              return { 
                  id: item.id,
                  title:item.title,
                  url:item.url,
                  createdAt:item.createdAt,
                  updatedAt:item.updatedAt,
                  userId:item.userId,
                  user: { //nested user object
                      id: item.userId,
                      username: item.username,
                      createdAt:item.userCreatedAt,
                      updatedAt:item.userUpdatedAt
                  },
                  subreddit: { //nested subreddit object
                      id: item.subredditId,
                      name: item.subredditName,
                      description: item.subredditDescription,
                      createdAt: item.subredditCreatedAt,
                      updatedAt: item.subredditUpdatedAt
                  }
              }
            })
        })
    }
    
    createSubreddit(subreddit){
        return this.conn.query(`INSERT INTO subreddits (name, description, createdAt, updatedAt) 
        VALUES (?, ?, NOW(), NOW())`, 
        [subreddit.name, subreddit.description])
        .then(result=> { 
            return subreddit.id;
        })
        .catch(error => {
        // Special error handling for duplicate entry
            if (error.code === 'ER_DUP_ENTRY') {
                    throw new Error('This subreddit already exists');
            }
            else {
                throw error;
            }
        });
    }
    getAllSubreddits(){
        return this.conn.query('SELECT * FROM subreddits ORDER BY createdAt DESC');
    
    }
    
    createVote(vote){
        if (vote.voteDirection === -1 || vote.voteDirection === 0 || vote.voteDirection === 1 ){
            return this.conn.query( 'INSERT INTO votes SET postId=?, userId=?, voteDirection=? ON DUPLICATE KEY UPDATE voteDirection=?', [vote.postId, vote.userId, vote.voteDirection, vote.voteDirection])
            .catch(console.log)
        }
        else {
            throw new Error("BAD VOTE");
        }
    }
    
    //In the reddit.js API, add a createComment(comment) function. It should take a comment object which contains a text, userId, postId and 
    // optional parentId. It should insert the new comment, and either return an error or the ID of the new comment. 
    // If parentId is not defined, it should be set to NULL. You can take some inspiration from the createPost function which operates in a similar way.
    
    

    createComment(comment){
        if(!comment.parentId) { comment.parentId = null; }
        return this.conn.query('INSERT INTO comments (text, userId, postId, parentId) VALUES (?, ?, ?, ?)', 
        [comment.text, comment.userId, comment.postId, comment.parentId])
        .then(result =>{
            return result.postId;
        }).catch(error => {
                // Special error handling return error
                if (error.code === 'ERROR') {
                    throw new Error('OOPS');
                }
                else {
                    throw error;
                }
            });
    }
    
    getCommentsForPost(postId, levels){
        return this.conn.query(
                `SELECT * FROM comments WHERE postId = ? AND parentId IS NULL LIMIT 25` [postId]
                ).then(result =>{

                    return this.getNextLevelComments(result, levels-1)
                
        
            });
   }
    
    getNextLevelComments(result, levels){
        
        if (levels === 0){
            return result;
        }
        
        var parentIdString = '';
        
        for (var i = 0; i < result.length; i++){
            parentIdString = parentIdString + ' parentId = ' + result[i].id + ' OR';
        }
        parentIdString = parentIdString.substring(0, parentIdString.length - 3);
        
        return this.conn.query(
            `SELECT * FROM comments WHERE postId = ? AND` + parentIdString + ` LIMIT 25` [result.postId]
            ).then(nextresult =>{
                if(nextresult){
                    for (var i = 0; i < result.length; i++){
                        var k = 0;
                        
                        for (var j = 0; j < nextresult.length; j++){
                            if (result[i].id === nextresult[j].parentId){
                                result[i].replies[k] = nextresult[j];
                                k++;
                            }
                        
                        }
                    }
                    return getNextLevelComments(nextresult, levels - 1);
                        } else {
                             return result;
                        }
                
            });
    }
}

module.exports = RedditAPI;
