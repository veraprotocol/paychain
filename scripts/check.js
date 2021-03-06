import Sequelize from 'sequelize';
import _ from 'lodash';
import config from '../config/config';
import redis from 'redis';
import Web3 from 'web3';

import { Promise } from 'bluebird';

const checkDB = () => {
    // connect to mysql db
    return new Promise((resolve, reject) => {
        const sequelize = new Sequelize(config.database.db,
            config.database.user,
            config.database.passwd,
            {
                dialect: 'mysql',
                port: config.database.port,
                host: config.database.host,
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    idle: 20000,
                    acquire: 20000,
                },
                timezone: '+05:00'
            }
        );
    
        sequelize
            .authenticate()
            .then(() => {
                console.log('MySql connection has been established successfully.');
                resolve();
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err.toString());
                reject(err);
            });
    });
};

const checkRedis = () => {
    return new Promise((resolve, reject) => {
        const client = redis.createClient({
            prefix: 'q',
            port: config.queue.port,
            host: config.queue.host,
            password: config.queue.password,
        });
    
        client.on("connect", () => {
            console.log("Redis connection is working.");
            resolve();
        })
    
        client.on('error', (err) => {
            console.log('Unable to connect to the redis:', err.toString());
            client.quit();
            reject(err);
        })
    });
};

const checkEthereumNode = () => {
    return new Promise((resolve, reject) => {
        const web3 = new Web3(config.web3.provider_url);

        web3.eth.net.isListening()
            .then(() => {
                console.log("Ethereum node is working");
                resolve();
            })
            .catch(err => {
                console.log("Unable to connect to ethereum node.", err.toString());
                reject(err);
            });
    });
};

Promise.some([
    checkDB(),
    checkRedis(),
    checkEthereumNode()
], 3)
.then(() => {
    process.exit();
})
.catch(() => {
    process.exit(1);
})
