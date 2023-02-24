function findUserByEmail(email, database) {
  for (const userId in database) {
    if (database[userId].email === email) {
      const user = database[userId];
      return user;
    }
  }

}


module.exports = findUserByEmail;

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

console.log(findUserByEmail("example@example.com", testUsers))