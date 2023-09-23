const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initilionBDAndSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Runing");
    });
  } catch (error) {
    console.log(`DB error:{error.meassge}`);
  }
};

initilionBDAndSever();

app.post(`/register`, async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
            user (username, name, password, gender, location) 
            VALUES 
            (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
            )`;
      const dbResponse = await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
// api -2

app.post(`/login`, async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
//api -3

app.put(`/change-password`, async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const sqlQuery = `SELECT * FROM user WHERE username='${username}'`;
  const userdate = await db.get(sqlQuery);
  if (userdate === undefined) {
    response.status(400);
    response.send("user not register");
  } else {
    const isvalidpassword = await bcrypt.compare(
      oldPassword,
      userdate.password
    );
    if (isvalidpassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptpassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `update user
                set
                username='${username}',
                password='${encryptpassword}';`;
        await db.run(updateQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
