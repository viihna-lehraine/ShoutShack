const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const getSecrets = require('./sops');
const argon2 = require('argon2');
const crypto = require('crypto');

secrets = getSecrets();


class User extends Model {
    async comparePassword(password) {
        return await argon2.verify(this.password, password + process.env.PEPPER);
    }
}


User.init({
    userid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unqiue: true
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
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    hibpCheckFailed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    guestbookProfile: {
        type: DataTypes.JSON,
        allowNull: true
    },
    customStyles: {
        types: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize,
    modelName: 'User',
    timestamps: false,
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