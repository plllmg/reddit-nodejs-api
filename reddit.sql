
# This creates the users table. The username field is constrained to unique
# values only, by using a UNIQUE KEY on that column

DROP DATABASE reddit;
CREATE DATABASE reddit;
use reddit;

CREATE TABLE users(
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(60) NOT NULL, 
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY username (username)
);

# This creates the posts table. The userId column references the id column of
# users. If a user is deleted, the corresponding posts` userIds will be set NULL.

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) DEFAULT NULL,
  url VARCHAR(2000) DEFAULT NULL,
  userId INT DEFAULT NULL,
  subredditId INT DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  KEY userId (userId), # why did we add this here? ask me :)
  CONSTRAINT validUser FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
);


CREATE TABLE subreddits(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  description VARCHAR(200) DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE INDEX name (name) 
);


CREATE TABLE votes (
  userId INT,
  postId INT,
  voteDirection TINYINT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (userId, postId), # this is called a composite key because it spans multiple columns. the combination userId/postId must be unique and uniquely identifies each row of this table.
  KEY userId (userId), # this is required for the foreign key
  KEY postId (postId), # this is required for the foreign key
  CONSTRAINT validUserVote FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE, # CASCADE means also delete the votes when a user is deleted
  CONSTRAINT validPost FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE # CASCADE means also delete the post when a vote is deleted
);


CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  postId INT,
  parentId INT,
  createdAt DATETIME,
  updatedAt DATETIME,
  text VARCHAR(10000),
  CONSTRAINT validCommentUser FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT validCommentPost FOREIGN KEY (userId) REFERENCES posts (id) ON DELETE SET NULL,
  CONSTRAINT validComment FOREIGN KEY (parentId) REFERENCES comments (id)
);