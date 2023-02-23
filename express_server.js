const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");  // tells Express to use EJS as its template engine

function generateRandomString() {
  let randomString = '';
  const characters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 
  'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  for (let i = 0; i < 6; i++) {
    let char = Math.floor(Math.random() * characters.length);
    randomString += characters[char];
  }
  return randomString;
}

function findUserByEmail(email) {
  let foundUserEmail = null;
  for (const userId in users) {
    if (users[userId].email === email) {
      foundUserEmail = users[userId];
    }
  }
  return foundUserEmail;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
}

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser())


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b> </body></html>\n");
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`)
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //checks if email/account already exists
  if (!findUserByEmail(email)) {
    return res.status(403).send("403 Forbidden: Email cannot be found.");
  }

  //checks if correct password is used
  if (findUserByEmail(email)) {
    let userObject = findUserByEmail(email)
    if (userObject["password"] !== password) {
      return res.status(403).send("403 Forbidden: Email and password do not match.");
    }
    res.cookie("user_id", userObject["id"])
    res.redirect("/urls");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/login");
});

//adds new users to the global users object
app.post("/register", (req, res) => {   

  //checks if email address already has an account
    if (findUserByEmail(req.body.email)) {
      return res.status(400).send("400 Bad Request: Email address already in use.");
    }
  const userID = generateRandomString();
  users[userID] = {id: userID, email: req.body.email, password: req.body.password };

  //checks for blank email or password
  if (!users[userID].email || !users[userID].password) {    
    return res.status(400).send("400 Bad Request: Please provide an email and password.");
  }


  
  res.cookie("user_id", userID);
  res.redirect("/urls");
})

//redirects the user away from the TinyApp and to the longURL
app.get("/u/:id", (req, res) => {   
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});