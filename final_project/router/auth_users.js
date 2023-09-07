const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
  if (users.find(user => user.username === username)) {
    return true;
  } else {
    return false;
  }
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
  if (users.find(user => user.username === username && user.password === password)) {
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  //Write your code here
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  } else if (!isValid(username)) {
    return res.status(400).json({message: "Username not found"});
  } else if (!authenticatedUser(username, password)) {
    return res.status(400).json({message: "Incorrect password"});
  } else {
    const accessToken = jwt.sign({username: username}, "access", {expiresIn: "20m"});
    const refreshToken = jwt.sign({username: username}, "refresh", {expiresIn: "7d"});
    req.session.authorization = {accessToken: accessToken, refreshToken: refreshToken};
    // return success message and access token
    return res.status(200).json({message: "Login successful", accessToken: accessToken});
  }

});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  // check if user is logged in
  // the review must get posted with the username of the logged in user
  // the review must be added to the book review dictionary
  // if the same user posts a review again, the old review must be replaced with the new one
  if (req.session.authorization) {
    const token = req.session.authorization['accessToken'];
    jwt.verify(token, "access",(err,user)=>{
      if(!err){
        const isbn = req.params.isbn;
        const review = req.body.review;
        const username = user.username;
        if (books[isbn]) {
          books[isbn]['reviews'][username] = review;
          return res.status(200).json({message: "Review posted successfully"});
        } else {
          return res.status(404).json({message: "Book not found"});
        }
      }
      else{
        return res.status(403).json({message: "User not authenticated"})
      }
    });
  } else {
    return res.status(403).json({message: "User not logged in"})
  }
  
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  // the user needs to be logged in to delete a review
  // the user can delete only his/her own review
  // if the user is logged in and the review is deleted, return success message
  // if the user is logged in but the review is not deleted, return error message
  // if the user is not logged in, return error message
  if (req.session.authorization) {
    const token = req.session.authorization['accessToken'];
    jwt.verify(token, "access",(err,user)=>{
      if(!err){
        const isbn = req.params.isbn;
        const username = user.username;
        if (books[isbn]) {
          if (books[isbn]['reviews'][username]) {
            delete books[isbn]['reviews'][username];
            return res.status(200).json({message: "Review deleted successfully"});
          } else {
            return res.status(404).json({message: "Review not found"});
          }
        } else {
          return res.status(404).json({message: "Book not found"});
        }
      }
      else{
        return res.status(403).json({message: "User not authenticated"})
      }
    });
  } else {
    return res.status(403).json({message: "User not logged in"})
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
