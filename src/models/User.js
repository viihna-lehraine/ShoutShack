const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const argon2 = require('argon2');
const crypto = require('crypto');

const PEPPER = process.env.PEPPER;


const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
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
    totpSecret: {
        type: DataTypes.STRING
    },
    hibpCheckFailed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    guestbookProfile: {
        type: DataTypes.JSON,
        allowNull: true
    },
    customStyles: {
        types: DataTypes.JSON,
        allowNull: true,
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            const salt = crypto.randomBytes(32).toString('hex');
            user.password = await argon2.hash(user.password + PEPPER, {
                type: argon2.argon2id,
                memoryCost: 19456, // 19 MiB memory
                timeCost: 2, // 2 iterations
                parallelism: 1,
                salt,
            })
        }
    }
});


// Password validation
User.validatePassword = (password) => {
    const isValidLength = password.Length >= 8 && password.length <= 128;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-za-z0-9]/.test(password);

    return isValidLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
};


// Password comparison
User.prototype.comparePassword = async function(password) {
    return await argon2.verify(this.password, password);
};


module.exports = User;