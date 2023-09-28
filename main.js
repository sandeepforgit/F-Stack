var express = require('express');
var app = express();

const path = require('path');

const bodyParser = require('body-parser');

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));


const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

var serviceAccount = require("./keyCap.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();


app.get("/", function (req, res) {
    res.render("home");
});


app.get("/signup", function (req, res) {
    const errors = [];
    res.render("signup",  {errors});
});

app.post("/signupsubmit", function (req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirm_password;
    const errors = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long.");
    }

    if (password !== confirmPassword) {
        errors.push("Password and confirm password do not match.");
    }

    db.collection("users")
        .where("username", "==", username)
        .get()
        .then(async function (docs) { 
            if (docs.size > 0) {
                errors.push("User already exists. Please choose a different username.");
            }

            if (errors.length > 0) {
                res.render("signup", { errors });
            } else {
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    db.collection("users").add({
                        username: username,
                        email: email,
                        password: hashedPassword,
                    })
                    .then(function () {
                        res.redirect("/dashboard");
                    })
                    .catch(function (error) {
                        res.status(500).send(`Error creating user: ${error.message}`);
                    });
                } catch (error) {
                    res.status(500).send(`Error hashing password: ${error.message}`);
                }
            }
        })
        .catch(function (error) {
            res.status(500).send(`Error checking for existing user: ${error.message}`);
        });
});






app.get("/login", function (req, res) {
    const errors = [];
    res.render("login", {errors});
});

app.post("/loginsubmit", async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const errors = [];

    if (!username || !password) {
        errors.push("Username and password are required.");
    }

    const userQuery = await db.collection("users")
        .where("username", "==", username)
        .get();

    if (userQuery.size === 0) {
        errors.push("User not found. Please create an account.");
    } else {
        const userData = userQuery.docs[0].data();
        const hashedPassword = userData.password;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            errors.push("Incorrect password. Please try again.");
        }
    }

    if (errors.length > 0) {
        res.render("login", { errors });
    } else {
        res.redirect("/dashboard");
    }
});



 app.get("/search-books", function (req, res) {
    const searchTerm = req.query.q;
    if (searchTerm) {
    const apiKey = "AIzaSyCY6VJ6O5Vfp0VEBvhxCBSWw1SX31nJPOU";
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
