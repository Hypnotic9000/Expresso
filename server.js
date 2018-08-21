const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// Add middware for parsing request bodies here:
app.use(bodyParser.json());

module.exports = app;

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

// Add middleware for handling CORS requests from index.html
const cors = require('cors');
app.use(cors());

// Add middleware for handling errors
const errorhandler = require('errorhandler');
app.use(errorhandler());

// Add request logger middleware Morgan
const morgan = require('morgan');
app.use(morgan('dev'));


// Mount your existing employeesRouter below at the '/employee' path.
const employeesRouter = require('./api/employees.js');
app.use('/api/employees', employeesRouter);

// Mount your existing menusRouter below at the '/menus' path.
const menusRouter = require('./api/menus.js');
app.use('/api/menus', menusRouter);

// Add your code to start the server listening at PORT below:
app.listen(PORT, (req, res, next) => {
    console.log(`Server is listening on port number ${PORT}`);
})

