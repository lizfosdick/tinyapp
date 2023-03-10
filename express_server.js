const cookieSession = require("cookie-session");
const express = require("express");
const bcrypt = require("bcryptjs");
const findUserByEmail = require('./helpers');
const app = express();
const PORT = 8080; // default port 8080

// tells Express to use EJS as its template engine
app.set("view engine", "ejs");

//generates random string for short url and user id
const generateRandomString = function() {
  let randomString = '';
  const characters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  for (let i = 0; i < 6; i++) {
    let char = Math.floor(Math.random() * characters.length);
    randomString += characters[char];
  }
  return randomString;
};

//returns urls owned by that user
const urlsForUser = function(urlDatabase, userId) {
  let returnedUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userId === userId) {
      returnedUrls[url] = urlDatabase[url];
    }
  }
  return returnedUrls;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "1234"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
};

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['bootcamp'],
  maxAge: 24 * 60 * 60 * 1000
}));

//displays the homepage
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(400).send("<html><body>Must be logged in to shorten URLs.</body></html>");
  }
  const templateVars = { urls: urlsForUser(urlDatabase, userId), user: users[userId] };
  res.render("urls_index", templateVars);
});

//displays the Shorten URL page, redirects users who are not logged in to the login page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id]  };
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//displays Registration page, redirects users who are already logged in
app.get("/register", (req, res) => {
  const templateVars = { user: null };
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

//displays Login page, redirects users who are already logged in
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { user: null };
  if (userId) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

//displays individual URL page
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(400).send("<html><body>Must be logged in to shorten URLs.</body></html>");
  }
  const urlObject = urlDatabase[req.params.id];
  if (!urlObject) {
    return res.status(400).send("<html><body>Bad Request: Short URL does not exist.</body></html>");
  }
  if (urlObject.userId !== userId) {
    return res.status(400).send("<html><body>Bad Request: Cannot edit URLs you don't own.</body></html>");
  }
  const templateVars = { id: req.params.id, longURL: urlObject.longURL, user: users[userId] };
  res.render("urls_show", templateVars);
});

//redirects / to the login page (if not logged in) or the homepage (if logged in)
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//creating a short URL
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send("<html><body>Must be logged in to shorten URLs.</body></html>");
  }
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userId: req.session.user_id
  };
  res.redirect(`/urls/${id}`);
});

//deleting a short URL
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  if (!req.session.user_id) {
    return res.status(400).send("<html><body>Must be logged in to delete URLs.</body></html>");
  }
  const urlObject = urlDatabase[req.params.id];
  if (!urlObject) {
    return res.status(400).send("<html><body>Bad Request: Short URL does not exist.</body></html>");
  }
  if (urlObject.userId !== userId) {
    return res.status(400).send("<html><body>Bad Request: Cannot delete URLs you don't own.</body></html>");
  }
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

//Takes the user to the short url page where they can edit, or tells them they need to log in to to edit URLs
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (!req.session.user_id) {
    return res.status(400).send("<html><body>Must be logged in to edit URLs.</body></html>");
  }
  const urlObject = urlDatabase[req.params.id];
  if (!urlObject) {
    return res.status(400).send("<html><body>Bad Request: Short URL does not exist.</body></html>");
  }
  if (urlObject.userId !== userId) {
    return res.status(400).send("<html><body>Bad Request: Cannot edit URLs you don't own.</body></html>");
  }
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});


//login endpoint
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);

  //checks if email/account already exists
  if (!user) {
    return res.status(403).send("403 Forbidden: Email cannot be found.");
  }

  //checks if correct password is used
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("403 Forbidden: Email and password do not match.");
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

//clears the login cookie and redirects the user to the login page upon logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//registration endpoint - adds new users to the global users object
app.post("/register", (req, res) => {

  //checks if email address already has an account
  if (findUserByEmail(req.body.email, users)) {
    return res.status(400).send("400 Bad Request: Email address already in use.");
  }
  //checks for blank email or password
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("400 Bad Request: Please provide an email and password.");
  }

  const password = req.body.password; // found in the req.body object
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userID = generateRandomString();
  users[userID] = {id: userID, email: req.body.email, password: hashedPassword };
  req.session.user_id = userID;
  res.redirect("/urls");
});

//redirects the user away from the TinyApp and to the longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(400).send("404 Error: URL not found.");
  }
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


