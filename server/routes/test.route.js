import express from 'express';
import testCtrl from '../controllers/test.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** GET /api/tests - Get testcases UI view */
    .get(testCtrl.index);

router.route('/transactions')

    /** GET /api/tests/transactions - Get testcases transactions UI view */
    .get(testCtrl.transactions);

router.route('/start')

    /** POST /api/tests - Start testcases */
    .post(testCtrl.start);

export default router;
