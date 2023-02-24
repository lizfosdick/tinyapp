const findUserByEmail =  function(email, database) {
  for (const userId in database) {
    if (database[userId].email === email) {
      const user = database[userId];
      return user;
    }
  }
}

module.exports = findUserByEmail;

