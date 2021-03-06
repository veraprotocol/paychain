import { encrypt } from '../helpers/crypto';
import { getBalance } from '../lib/web3';
import config from '../../config/config'
import Sequelize from 'sequelize'
import APIError from '../helpers/APIError'

const uuidv1 = require('uuid/v1');

/**
 * Account Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: () => {
              const uuid = uuidv1();
              const sorted_uuid = (uuid.substring(14, 18) + '-' + uuid.substring(9, 13)
                     + '-' + uuid.substring(0, 8) + '-' + uuid.substring(19, 23) + '-' + uuid.substring(24));
              return sorted_uuid;
            }
        },
        balance: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.NOW,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        privateKey: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'accounts',
        validate: {
            noNegativeBalance: function (next) {
                if (this.balance < 0) {
                    next(new APIError("Balance cannot be negative"));
                } else {
                    next();
                }
            },
            addressExists: function(next) {
                Account.findAll({
                    where: {
                        address: sequelize.where(sequelize.fn('LOWER', sequelize.col('address')), '=', this.address),
                        id: {
                            [Sequelize.Op.ne]: this.id
                        }
                    }
                })
                .then((accounts) => {
                    if (accounts.length > 0) {
                        next(new APIError("Account already exists"));
                    } else {
                        next();
                    }
                })
                .catch((error) => {
                    next(error);
                });
            }
        },
        setterMethods: {
            privateKey(value) {
                this.setDataValue('privateKey', encrypt(value));
            },
        },
        hooks: {
            beforeCreate: function(account, options) {
                return new Promise((resolve, reject) => {
                    getBalance(config.web3.payment_address, account.address)
                        .then((balance) => {
                            account.balance = balance;
                            resolve(account)
                        })
                        .catch((err) => {
                            resolve(account);
                        });
                });
            }
        }
    });

    Account.prototype.toJSON = function () {
        const account = Object.assign({}, this.get());

        delete account.privateKey;
        account.balance = account.balance.toString();
        return account;
    };

    return Account;
};
