/*
Customer satisfaction API
*/

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

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

const Review = mongoose.model("review", ReviewSchema);

app.post("/review", function(req, res) {
    Review.create(req.body).then(function (review) {
        res.send(review);
    });
})

app.get("/report", function(req, res) {
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

app.get("/report/:locationId", function(req, res) {
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
