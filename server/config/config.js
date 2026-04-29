require('dotenv').config();

module.exports = {
  secretKey: process.env.SECRET_KEY || 'default_dev_secret',
  localDB: process.env.DB_URI || 'mongodb://localhost/realestatedb'
}
