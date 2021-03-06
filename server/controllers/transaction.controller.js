import httpStatus from 'http-status';
import db from '../../config/sequelize';
import moment from 'moment';
import APIError from '../helpers/APIError'

const Transaction = db.Transaction;

/**
 * Load transaction and append to req.
 */
function load(req, res, next, id) {
    Transaction.findByPk(id)
        .then((transaction) => {
            if (!transaction) {
                const e = new APIError('Transaction does not exist');
                e.status = httpStatus.NOT_FOUND;
                return next(e);
            }
            req.transaction = transaction; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch(e => next(e));
}

/**
 * Get transaction
 * @returns {Transaction}
 */
function get(req, res) {
    return res.json(req.transaction);
}

function buildSearchQuery(params) {
    let query = {};
    for (const key of Object.keys(params)) {
        switch(key) {
            case 'dateFrom':
                query['createdAt'] = query['createdAt'] || {};
                query['createdAt']['$gte'] = moment(params[key]).startOf('day');
                break;
            case 'dateTo':
                query['createdAt'] = query['createdAt'] || {};
                query['createdAt']['$lte'] = moment(params[key]).endOf('day');
                break;
            case 'amountFrom':
                query['amount'] = query['amount'] || {};
                query['amount']['$gte'] = params[key];
                break;
            case 'amountTo':
                query['amount'] = query['amount'] || {};
                query['amount']['$gte'] = params[key];
                break;
            case 'limit':
            case 'offset':
                break;
            default:
                query[key] = params[key];
                break;
        }
    }
    return query;
} 
/**
 * Search transaction
 * @returns [Transaction]
 */
function search(req, res, next) {
    const offset = parseInt(req.query.offset) || 0;
    const limit  = parseInt(req.query.limit) || 50;
    const query  = buildSearchQuery(req.query);

    Transaction.findAll({ where: query, limit, offset,
          include: [
              { model: db.Account, as: 'fromAcc'},
              { model: db.Account, as: 'toAcc'},
              { model: db.Currency, as: 'currency'}
          ]
        })
        .then(transactions => res.json(transactions))
        .catch(e => next(e));
}

/**
 * Create new transaction
 * @returns {Transaction}
 */
function create(req, res, next) {
    const transaction = Transaction.build({
        from: req.body.from,
        to: req.body.to,
        amount: req.body.amount
    });

    db.Currency.findOne({}).then((currency) => {
        if (currency) {
            transaction.currency_id = currency.id;
        }

        transaction.status = 'initiated';
        transaction.save()
            .then(savedTransaction => res.status(201).json(savedTransaction))
            .catch(e => next(e));
    }).catch(e => next(e));
}

/**
 * Calculates transaction stats
 * @returns stats
 */

function stats(req, res, next) {
    Transaction.findAll({
        group: ['status'],
        attributes: ['status', [db.sequelize.fn('COUNT', 'status'), 'statusCount']],
    })
    .then(transactionStats => res.json(transactionStats))
    .catch(e => next(e));
}


export default { load, get, create, search, stats };
