/*
Customer satisfaction API
*/

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Global app object
const app = express();

// Middleware config
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Database connection
mongoose.connect(
    process.env.MONGO_URI,
    { useUnifiedTopology: true, useNewUrlParser: true }
);

const ReviewSchema = mongoose.Schema({
    locationId: {
        type: Number,
        min: 0,
        required: true
    },
    score: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    datetime: {
        type: Date,
        default: Date.now
    }
});

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("user", UserSchema);

const Review = mongoose.model("review", ReviewSchema);

function checkCredentials(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({"message": "A token is required for authorization"});
    }
    try {
        const user = jwt.verify(token, process.env.API_KEY);
        req.userId = user.id;
        next()
    } catch (error) {
        return res.status(401).send({"message": "Invalid API token"});
    }
};

app.post("/sign-up", function(req, res) {
    const password = bcrypt.hashSync(req.body.password, 10);
    User.create({ ...req.body, password: password }).then(function (user) {
        res.status(201).send(user);
    })
});

app.post("/login", function(req, res) {
    const { email, password } = req.body;
    User.findOne({ email: email}).then(function (user) {
        if (!bcrypt.compareSync(password, user.password)) {
            res.status(401).send({"message": "Incorrect user or password"})
        }
        const token = jwt.sign({
            id: user._id, 
        }, process.env.API_KEY);
        res.send({ token: token });
    });
});

app.post("/review", function(req, res) {
    Review.create(req.body).then(function (review) {
        res.send(review);
    });
})

app.get("/report", checkCredentials, function(req, res) {    
    Review.find().then(function (reviews) {
        const clients = reviews.length;
        const scoreSum = reviews.reduce(function (sum, review) {
            return sum + review.score;
        }, 0);
        const average = scoreSum / clients;
        res.send({
            clients,
            scoreAverage: average ? average : 0,
        });
    });
})

app.get("/report/:locationId", checkCredentials, function(req, res) {
    const locationId = req.params.locationId;
    Review.find({locationId: locationId}).then(function (reviews) {
        const clients = reviews.length;
        const scoreSum = reviews.reduce(function (sum, review) {
            return sum + review.score;
        }, 0);
        const average = scoreSum / clients;
        res.send({
            clients,
            scoreAverage: average ? average : 0,
        });
    });
})

app.get("/", function (req, res) {
    res.send("Welcome to customer satisfaction API!");
});

// Bootstrap server
const server = app.listen(process.env.PORT || 3000, function () {
    console.log(`Listening on port ${server.address().port}`);
});
