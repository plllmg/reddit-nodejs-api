'use strict'

var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }

    createUser(user) {
        /*
        first we have to hash the password. we will learn about hashing next week.
        the goal of hashing is to store a digested version of the password from which
        it is infeasible to recover the original password, but which can still be used
        to assess with great confidence whether a provided password is the correct one or not
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
        /*
        strings delimited with ` are an ES2015 feature called "template strings".
        they are more powerful than what we are using them for here. one feature of
        template strings is that you can write them on multiple lines. if you try to
        skip a line in a single- or double-quoted string, you would get a syntax error.

        therefore template strings make it very easy to write SQL queries that span multiple
        lines without having to manually split the string line by line.
         */
// Now that we have voting, we need to add the voteScore of each post by doing an extra JOIN to the votes table, 
//grouping by postId, and doing a SUM on the voteDirection column.
// To make the output more interesting, we need to ORDER the posts by the highest voteScore first instead of creation time.

        return this.conn.query(
            `
            SELECT posts.id, posts.subredditId, posts.title, posts.url, posts.userId, posts.createdAt, posts.updatedAt, 
            users.username, users.createdAt AS userCreatedAt, users.updatedAt AS userUpdatedAt, 
            subreddits.id AS subredditId, subreddits.name AS subredditName, subreddits.description AS subredditDescription, 
            subreddits.createdAt AS subredditCreatedAt, subreddits.updatedAt AS subredditUpdatedAt
            FROM posts 
            JOIN users ON posts.userId = users.id
            JOIN subreddits ON posts.subredditId = subreddits.id
            JOIN votes ON posts.postID = postVotes
            ORDER BY posts.createdAt DESC
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
                  user: {
                      id: item.userId,
                      username: item.username,
                      createdAt:item.userCreatedAt,
                      updatedAt:item.userUpdatedAt
                  },
                  subreddit: {
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
        return this.conn.query(`'INSERT INTO subreddits (name,description, createdAt, updatedAt) 
        VALUES (?, ?, NOW(), NOW())'`, 
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
}
module.exports = RedditAPI;
