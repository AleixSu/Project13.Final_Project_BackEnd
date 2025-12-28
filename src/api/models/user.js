const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema(
  {
    nickName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    frstSurname: { type: String, trim: true },
    scndSurname: { type: String, trim: true },
    email: { type: String, required: true, trim: true },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate: {
        validator: (v) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(v),
        message:
          'Password must have at least 8 characters, including one lowercase letter, one uppercase letter, one number, and one special character'
      }
    },
    birthDate: { type: Date, trim: true },
    profileImg: { type: String },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
      default: 'user'
    },
    location: { type: String, trim: true },
    attendingEvents: [{ type: mongoose.Types.ObjectId, ref: 'events' }],
    gender: { type: String }
  },
  {
    timestamps: true,
    collection: 'users'
  }
)

userSchema.pre('save', function () {
  this.password = bcrypt.hashSync(this.password, 10)
})

const User = mongoose.model('users', userSchema, 'users')
module.exports = User
