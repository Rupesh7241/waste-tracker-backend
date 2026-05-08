const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String,  required: [true, 'Please add a name'] },
    email:    { type: String,  required: [true, 'Please add an email'], unique: true, lowercase: true },
    password: { type: String,  required: [true, 'Please add a password'], minlength: 6 },
    role:     { type: String,  enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

// No "next" parameter at all — uses promise-based pre-save
userSchema.pre('save', function () {
  if (!this.isModified('password')) return Promise.resolve();
  return bcrypt.genSalt(10)
    .then(salt => bcrypt.hash(this.password, salt))
    .then(hash => { this.password = hash; });
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);