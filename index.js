//imports
const express = require('express');
const handleBars = require('express-handlebars');
const fetch = require('node-fetch');
const withQuery = require('with-Query').default;
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

//Init express
const app = express();

//setup handlebars
function hbsHelpers(handleBars) {
    return hbs.create({
      helpers: { // This was missing
        inc: function(value, options) {
            return parseInt(value) + 1;
        }
      }
    });
}

app.engine('hbs', handleBars({ 
    defaultLayout: 'default.hbs',
    helpers: {
        inc: function(value, options) {
                    return parseInt(value) + 1;
        }}
    }))
    
app.set('view engine' , 'hbs');
app.set('views', __dirname + '/views');

//set up database connection
    // Create the database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'goodreads',
    user: process.env.DB_USER || 'newdude1' , //DO NOT HARD CODE OR HAVE DEFAULTS TO THIS (remember to remove)
    password: process.env.DB_PASSWD || 'nd11', //DO NOT HARD CODE OR HAVE DEFAULTS TO THIS (remember to remove)
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00'
})
    // Start test DB connection
const startApp = async (app, pool) => {

    const conn = await pool.getConnection();

    try {
        
        console.info('Pinging Database...');

        await conn.ping();

    } catch (e) {
        console.error('Cannot ping database: ', e)

    } finally {

        await conn.release();
        console.info('Closed database')

    }
}

startApp(app, pool); //end optional test

//remember to remove the settings 3000 and nyt apikey
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

const API_KEY = process.env.API_KEY || 'NtjbyjDcW4ORcVimPSRBAGPkh5HZiMXG';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get('/', (req, res) => {
    const Alphabets = ['A','B','C', 'D', 'E', 'F', 
                        'G', 'H', 'I', 'J', 'K', 'L', 
                        'M', 'N', 'O', 'P', 'Q', 'R', 
                        'S', 'T', 'U', 'V', 'W', 'X', 
                        'Y', 'Z'];
    const NumbersIntegers = [];
    for (i = 0 ; i < 10 ; i++) {
        NumbersIntegers.push(i);
    }

    res.render('landing', {
        alphabets: Alphabets,
        numbers: NumbersIntegers
    })

    console.info(Alphabets, NumbersIntegers)
    
})

app.get('/booklist/:startCharOfBookTitle', (req, res) => {

})

//Run the server
if (API_KEY) {
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`);
        console.info(`with key ${API_KEY}`);
    })
} else {
    console.error('API_KEY is not set');
}



