const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const uniqueValidator = require('mongoose-unique-validator')
const secret = require('../config').secret

const UserSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, unique: true, required: [true, 'can\'t be blank'], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true },
  hash: String,
  salt: String
}, { timestamps: true })

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' })

UserSchema.methods.validPassword = function (password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
  return this.hash === hash
}

UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
}

UserSchema.methods.generateJWT = function () {
  var today = new Date()
  var exp = new Date(today)
  exp.setDate(today.getDate() + 60)

  return jwt.sign({
    id: this._id,
    email: this.email,
    exp: parseInt(exp.getTime() / 1000),
  }, secret)
}

UserSchema.methods.toAuthJSON = function () {
  return {
    email: this.email,
    token: this.generateJWT(),
  }
}

const User = mongoose.model('User', UserSchema)

export default User
