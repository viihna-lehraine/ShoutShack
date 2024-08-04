const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const argon2 = require('argon2');


const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    totpSecret: {
        type: DataTypes.STRING
    },
    guestbookProfile: {
        type: DataTypes.JSON,
        allowNull: true
    },
    customStyles: {
        types: DataTypes.JSON,
        allowNull: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            const salt = crypto.randomBytes(16).toString('hex');
            user.password = await argon2.hash(user.password, { type: argon2.argon2id, salt });
        }
    }
});


// Password validation
User.validatePassword = async (password) => {
    const isValid = password.length >= 8 && password.length <= 128;
    return isValid;
};


// Password comparison
User.prototype.comparePassword = async function(password) {
    return await argon2.verify(this.password, password);
};


module.exports = User;