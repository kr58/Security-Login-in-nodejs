var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var Nexmo = require('nexmo');
var bcrypt = require('bcryptjs');
// var passport = require('passport');
// var LocalStrategy = require('passport-local').Strategy;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/bank";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.createCollection("users", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});

// const nexmo = new Nexmo({
//   apiKey: 'd9894a22',
//   apiSecret: '128e09b578e8a6cd'
// });

// var routes = require('./routes/index');
// var users = require('./routes/users');

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

function validation(email,password,response,request){
  console.log("Verification");
  MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var myobj = {email: email};
      console.log(myobj);
      db.collection("users").findOne(myobj, function(err, res) {
        if (err) throw err;
        else {console.log("True");
          console.log(res.name);
          bcrypt.compare(password, res.password, function(err, isMatch) {
            if(err) throw err;
            if(isMatch) {
              app.engine('handlebars', exphbs({defaultLayout:'home'}));
              console.log("Password True");
              request.flash('success_msg', 'Success login');
              //response.redirect('/user/home');
              response.render('home');
              console.log("Here");
            }
            else response.redirect('/');
          });
        }
        db.close();
      });
    });
}

app.get('/', function(req, res){
  app.engine('handlebars', exphbs({defaultLayout:'layout'}));
  res.render('index');
});

app.get('/users/register', function(req, res){
  console.log('register');
  res.render('register');
});

app.get('/users/login', function(req, res){
  console.log('login');
  res.render('login');
});

//app.get('/user/home', function(req, res){
//  console.log('home');
//});

app.get('/user/withdraw', function(req, res){
  console.log('withdraw');
  res.render('withdraw');
});

app.post('/users/login',function(req, res){
  var email = req.body.email;
  var password = req.body.password;

  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();

  var errors = req.validationErrors();

  if(errors){
    res.render('login',{
      errors:errors
    });
  } 
  else {
    validation(email, password, res, req);
  }
});

app.post('/users/register', function(req, res){
  console.log('post register');
  
  var name = req.body.name;
  var email = req.body.email;
  var number = req.body.number;
  var password = req.body.password;
  var password2 = req.body.password2;
  var type = req.body.type;
  var AccountNo = Math.floor(Math.random()*1000000000000);
  var Balance = 0;
  console.log(AccountNo);

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('number', 'Number is required').notEmpty();
  //req.checkBody('number', 'Number is not valid').isNumber();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if(errors){
    res.render('register',{
      errors:errors
    });
  } 
  else {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
          password = hash;
      });
    });
    
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var myobj = { name: name, email: email, number: number, type: type, balance: Balance, account: AccountNo, password: password};
      console.log(myobj);
      db.collection("users").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });

    req.flash('success_msg', 'You are registered and can now login');

    res.redirect('/users/login');
  }
});

app.listen(3000, function(){
	console.log('Server started on port '+3000);
});