module.exports = {
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true
  },
  password: 'Password',
  phoneNumber: Number,
  lastSignIn: {
    type: Date,
    required: false,
  }
}
