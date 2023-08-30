var express = require('express');
var app = express();

const path = require('path');



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

var serviceAccount = require("./keyCap.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();


app.get("/", function (req, res) {
    const backgroundImagePath = "C:\Users\sande\Desktop\Full stack\lib.jpeg";
    res.render("home", { backgroundImagePath});
});


app.get("/signup", function (req, res) {
    res.render("signup");
});

app.get("/signupsubmit", function (req, res) {
    console.log(req.query);
    db.collection("users").add({
        username: req.query.username,
        email: req.query.email,
        password: req.query.password,
        confirm_password: req.query.confirm_password

    })
    res.redirect("/dashboard");
});





app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/loginsubmit", function (req, res) {
    db.collection("users")
        .where("username", "==", req.query.username)
        .where("password", "==", req.query.password)
        .get()
        .then(function (docs) {
            if (docs.size > 0) {
                res.redirect("/dashboard");
            }
            else {
                res.send("please check your password and username once or create an account");
            }
        })
})


 app.get("/search-books", function (req, res) {
    const searchTerm = req.query.q;
    if (searchTerm) {
    const apiKey = "API KEY";
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchTerm}&key=${apiKey}`;
    
    axios.get(apiUrl)
    .then(response => {
        const books = response.data.items;
        const searchResults = books.map(book => {
            return {
                title: book.volumeInfo.title,
                author: book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author",
                publishedYear: book.volumeInfo.publishedDate ? book.volumeInfo.publishedDate.substring(0, 4) : "N/A",
                coverUrl: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : null
            };
        });
            
        res.render("dashboard", { searchTerm, searchResults, showResults: true });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send(`An error occurred: ${error.message}`);
    });
} else {
   
    res.render("dashboard", { searchTerm: null, searchResults: null, showResults: false });
}
});


app.get("/dashboard", function (req, res) {
    res.render("dashboard", { searchTerm: null, searchResults: [], showResults: false  });
});





app.listen(3000);
