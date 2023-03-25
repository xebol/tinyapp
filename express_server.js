const express = require('express');
const app = express();
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, isValidHttpUrl, generateRandomString, urlsForUser } = require('./helpers');
const { urlDatabase, users } = require('./databases');
const PORT = 8080;

app.use(express.urlencoded({ extended: true })); //populates req.body
app.use(morgan('dev')); //console logs the request coming on the terminal
app.set('view engine', 'ejs'); //set the view engine to ejs templates
app.use(cookieSession({
  name: 'user_id',
  keys: ['secret']
}));


//Homepage
app.get('/', (req, res) => {
  //tells user where to login
  res.send('<h1>Welcome to the home page!</h1> Please login <a href="/login">here<a/>');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const userID = req.session.user_id; //only logged in users will have a cookie
  const user = users[userID];
  const userURLs = urlsForUser(userID, urlDatabase);

  const templateVars = {
    urls: userURLs,
    user: user
  };

  if (!user) {
    return res.status(401).send('<h3>Make sure you are logged in!<h3> Login <a href="/login">here</a>');
  }

  res.render("urls_index", templateVars);
});

//If user is not logged in. Redirects to login page
app.get('/urls/new', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.status(401).send('<h3>Make sure you are logged in!<h3> Login <a href="/login">here</a>');
  }

  const user = users[userID];
  const templateVars = {
    user: user
  };

  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const loggedInUser = req.session.user_id;
  const user = users[loggedInUser]; //accessing users database
  const url = urlDatabase[req.params.id]; //accessing urlDatabase object
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: user
  };

  //checks if the user is logged in
  if (!loggedInUser) {
    return res.status(401).send('<h3>Make sure you are logged in!</h3> Login <a href="/login">here</a>');
  }

  //checks if the user owns the url
  if (url.userID !== loggedInUser) {
   return res.status(401).send('<h2>Unathorized to view this page<h2>');
  }

  if (!user) {
    return res.status(400).send('<h3>Make sure you are logged in!<h3> Login <a href="/login">here</a>');
  }
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const url = urlDatabase[req.params.id];
  const userID = req.session.user_id;

  //check if the ID is in the database
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send('<h2>The ID does not exist.</h2>');
  }
  //check if user is logged in
  if (!userID) {
    return res.status(400).send('<h3>Please login to continue. </h3> Login <a href="/login">here</a>');
  }

  if (!isValidHttpUrl(req.body.url)) {
    return res.status(400).send('<h3>Invalid URL. Please enter the complete URL</h3>');
  }

  //check if userID matches the URL
  if (userID !== url.userID) {
    return res.status(400).send('<h2>Only accessible to URL owner</h2>');
  }

  urlDatabase[req.params.id].longURL = req.body.url;
  res.redirect('/urls');
});

//Checks if the user is logged in before adding a url into the database
app.post('/urls', (req, res) => {
  const userID = req.session.user_id;

  if (!isValidHttpUrl(req.body.longURL)) {
    return res.status(400).send('<p>Invalid URL. Please enter the complete URL</p>');
  }

  if (!userID) {
    return res.status(400).send('<p>Please login to continue.</p>');
  }
  const uniqueID = generateRandomString();
  urlDatabase[uniqueID] = {
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`/urls/${uniqueID}`);
});

//handles short URL that does not exist in the database
app.get('/u/:id', (req, res) => {
  const url = urlDatabase[req.params.id];

  res.redirect(url.longURL);
});

//deletes the current url
app.post('/urls/:id/delete', (req, res) => {
  const url = urlDatabase[req.params.id];
  const userID = req.session.user_id;

  //check if the ID is in the database
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send('<p>The ID does not exist.</p>');
  }
  //check if user is logged in
  if (!userID) {
    return res.status(400).send('<h3>Please login to continue.</h3> Login <a href="/login">here</a>');
  }
  //check if userID matches the URL
  if (userID !== url.userID) {
    return res.status(400).send('<h3>URL provided does not match</h3>');
  }
  //deletes
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Registering users
app.get('/register', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: user
  };
  res.render('urls_register', templateVars);
});

app.get('/login', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: user
  };
  res.render('urls_login', templateVars);
});

//Register post endpoint
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide email and password.');
  }

  const user = getUserByEmail(email, users);
  console.log('user', user);
  if (user) {
    return res.status(400).send('That email is alredy in use. Please provide a different email.');
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: hash
  };

  req.session.user_id = userID;
  res.redirect('/urls');
});


//Creating cookies
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('<p>Please provide email and password</p>');
  }
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send('<p>No user with that email found</p>');
  }

  const result = bcrypt.compareSync(password, user.password);
  if (!result) {
    return res.status(403).send('<p>Invalid Password</p>');
  }

  //create a new cookie using cookie-session
  req.session.user_id = user.id;
  res.redirect('/urls');
});

//Clearing cookies
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}!`);
});