// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const getSecrets = require('./sops');

const secrets = getSecrets();

console.log('passport.js - JWT Secret: ', secrets.JWT_SECRET);

if (!secrets.JWT_SECRET) {
  throw new error('passport.js - JWT_SECRET is not defined');
}

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secrets.JWT_SECRET;


module.exports = (passport) => {
  passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
          const user = await User.findByPk(jwt_payload.id);
          if (user) {
              return done(null, user);
          }
          return done(null, false);
      } catch (err) {
          return done(err, false);
      }
  }));


  passport.use(new LocalStrategy(async (username, password, done) => {
      try {
          const user = await User.findOne({ where: { username }});
          if (!user) {
              return done(null, false, { message: 'User not found' });
          }

          const isMatch = await user.comparePassword(password);
          if (isMatch) {
              return done(null, user);
          } else {
              return done(null, false, { message: 'Incorrect password' });
          }
      } catch (err) {
          return done(err);
      }
  }));
};