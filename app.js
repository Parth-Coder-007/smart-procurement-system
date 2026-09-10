const express = require('express');
const path = require('path');
const session = require('express-session');

const farmerRoute = require('./routes/farmerRouter');
const govRoute = require('./routes/govRouter');
const app = express();

// Session
app.use(session({
    secret: 'khetsetu-secret',
    resave: false,
    saveUninitialized: false
}));

// Read JSON data
app.use(express.json());

// Read form data
app.use(express.urlencoded({ extended: true }));

// Serve CSS, JS and images
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use((req, res, next) => {
    console.log("middleware 1");
    next();
});

// First page → Home page
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'view', 'farmer portal', 'home.html')
    );
});

// Farmer routes
app.use('/farmer', farmerRoute);
//---------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------
//          Goverment Portal
//---------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------
app.use('/gov', govRoute);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`server running on address http://localhost:${PORT}`);
});