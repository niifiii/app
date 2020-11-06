//imports
const express = require('express');
const handleBars = require('express-handlebars');
const fetch = require('node-fetch');
const withQuery = require('with-Query').default;
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const querystring = require('querystring');
const morgan = require('morgan');

//Init express
const app = express();
app.use(morgan('combined'));

//setup handlebars
app.engine('hbs', handleBars({ 
    defaultLayout: 'default.hbs',
    helpers: {
        inc: function (value, options) {
                    return parseInt(value) + 1;
        },
        csl: function (value, options) {
                    return value.replaceAll("|", ",");
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

    //console.info(Alphabets, NumbersIntegers)
    
})

app.get('/bookslist/:startCharOfBookTitle', async (req, res) => {
    const conn = await pool.getConnection();
    //console.log('here:' + req.params.startCharOfBookTitle)
    try {
        const startChar = req.params.startCharOfBookTitle;
        //console.log(startChar)
        res.status(200);
        res.type('text/html');
        let SQL_QUERY_FOR_START_CHAR_OF_BOOK_TITLE = "SELECT title, book_id FROM `goodreads`.`book2018` WHERE `title` LIKE ? ";

        const result = await conn.query(SQL_QUERY_FOR_START_CHAR_OF_BOOK_TITLE, [startChar + '%']);
        //console.log('here' + JSON.stringify(result[0]));///////////////////////////////////////////
        //const records = [];
        //const bookIDs = [];
        //for (let item of result[0]) {
        //    records.push(item.title);
        //    bookIDs.push(item.bookID)
        //}
        //var partialRecords = records.slice(0, 11);
        //var partialBookIDs = bookIDs.slice(0, 11);
        //console.log('typeof: ' + typeof result[0]) <-- this is an object
        let records = result[0];
        for (item of records) {
            item.page = 1;
            item.startChar = startChar;
        }
        let partialRecords = records.slice(0, 11);

        res.render('bookslist', {
            startChar: startChar,
            //results: result[0],
            results: partialRecords,
            //bookIDs: partialBookIDs,
            backnext: { 
                back: 0,
                next: 2
            },
            notpageone: false,
            notlastpage: true
        })

    } catch (e) {
        console.error('error',  e); 
    } finally {
        await conn.release()
    }
}) 

app.get('/bookslist/:startCharOfBookTitle/:page', async (req, res) => {
    const conn = await pool.getConnection();
    //console.log('here:' + req.params.startCharOfBookTitle)
    try {
        const startChar = req.params.startCharOfBookTitle;
        const page = req.params.page;
        //console.info(page, startChar);

        res.status(200);
        res.type('text/html');
        let SQL_QUERY_FOR_START_CHAR_OF_BOOK_TITLE = "SELECT title, book_id FROM `goodreads`.`book2018` WHERE `title` LIKE ? ";

        const result = await conn.query(SQL_QUERY_FOR_START_CHAR_OF_BOOK_TITLE, [startChar + '%']);
        //console.log(JSON.stringify(result[0]));
        //const records = [];
        //for (let item of result[0]) {
        //    records.push(item.title);
        //}
        let records = result[0];
        for (item of records) {
            item.page = parseInt(page);
            item.startChar = startChar;
        }
        let numberOfRecords = records.length;
        let numberOfPages = Math.ceil(numberOfRecords / 10);
        const pageInt = parseInt(page);
        if (!(pageInt < 0 || pageInt > numberOfPages)) {
            var partialRecords = records.slice(((pageInt -1) * 10) + 0, ((pageInt -1)* 10) + 11);
        }

        console.info( numberOfRecords, numberOfPages, partialRecords);

        res.render('bookslist', {
            startChar: startChar,
            
            results: partialRecords,
            backnext: { 
                back: pageInt - 1,
                next: pageInt + 1
            },
            notpageone: (pageInt === 1) ? false : true,
            notlastpage: (pageInt === numberOfPages) ? false : true
        })

    } catch (e) {
        console.error('error',  e); 

    } finally {
        await conn.release()

    }
})

app.get('/bookdetails/:bookID', async (req, res) => {
    //console.log(bookID)// works!
    const conn = await pool.getConnection();
    //console.log('here:' + req.params.startCharOfBookTitle)
    try {
        const bookID = req.params.bookID;
        
        const startChar = req.query.startchar;
        const backpage = req.query.page;
        //console.info(backpage, startChar);
        res.status(200);
        res.type('text/html');
        let SQL_QUERY_FOR_BOOKID = "SELECT title, authors, pages, rating, rating_count, genres, image_url FROM `goodreads`.`book2018` WHERE book_id = ?;";

        const result = await conn.query(SQL_QUERY_FOR_BOOKID, [bookID]);
        //console.log(JSON.stringify(result[0]));
        //const records = [];
        //for (let item of result[0]) {
        //    records.push(item.title);
        //}
        let record = result[0][0];
        //console.log(record);
        res.render('bookdetails', {
            result: record,
            back: backpage,
            startChar: startChar
        });

    } catch (e) {
        console.error('error',  e); 

    } finally {
        await conn.release()

    }
})

app.post('/findreviews', (req, res) => {
    const bookTitle = req.body.bookTitle;
    console.log('1. ' + bookTitle + querystring.escape(bookTitle)); //ok

    const ENDPOINT = 'https://api.nytimes.com/svc/books/v3/reviews.json';
    var apikey = API_KEY;

    const url = withQuery(
        ENDPOINT,
        {
            'api-key' : API_KEY,
            'title' : querystring.escape(bookTitle)
        }
    )
    console.log(url)

    //{ status, copyright, num_results, results}
    //console.log(url)
    let bookReviewsNYT = fetch(url);  
    //console.log('hello' + bookReviewsNYT);
    bookReviewsNYT.then ( result => {
        console.log(JSON.stringify(result));////////////////////////// <--------------------------- url works on browser
        return result.json();
    
    })
    .then ( result => {
        if (result.status !== 'ok') {
            res.status(200);
            res.type('text/html');
            res.send = '<h1> Error </h1>';
            console.log('error page')
            return null;
        }

        if (results.num_results <= 0) {
            console.log('no results found')
            res.status(200);
            res.type('text/html');
            res.send = '<h1> No results found </h1>'
            return null;
        }



        let listofreviews = result.results;
        console.log('here' + JSON.stringify(listofreviews)    );

        for (let item of listofreviews) {
            item.copyright = result.copyright
        }

        let backdetailpage = null;
        res.status(200);
        res.type('text/html');
        res.render('findreviews', {
            listofreviews: listofreviews,
            backdetailpage: backdetailpage
        });
        res.end();
    })

    //res.end() <--cannot have this if we have res.render will set the header after res sent
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



