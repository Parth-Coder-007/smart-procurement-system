const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const router = express.Router();


// =====================================
// DATABASE CONNECTION
// =====================================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'khetsetu',
    ssl: {
        ca: process.env.DB_CA_CERT
    }
});



// =====================================
// GOVERNMENT DASHBOARD
// =====================================

router.get('/', (req, res) => {

    if (!req.session.govLoggedIn) {
        return res.redirect('/gov/login');
    }

    res.sendFile(
        path.join(__dirname, '..', 'view', 'gov portal', 'index.html')
    );

});


// =====================================
// LOGIN PAGE
// =====================================

router.get('/login', (req, res) => {

    res.sendFile(
        path.join(__dirname, '..', 'view', 'gov portal', 'login.html')
    );

});


// =====================================
// GOVERNMENT LOGIN
// =====================================

router.post('/login', (req, res) => {

    const { officerId, password } = req.body;

    const sql = `
        SELECT *
        FROM government_users
        WHERE officer_id = ?
        AND password = ?
    `;

    db.query(sql, [officerId, password], (err, results) => {

        if (err) {

            console.log(err);

            return res.send('Database error');

        }

        if (results.length > 0) {

            req.session.govLoggedIn = true;

            req.session.govOfficerId =
                results[0].officer_id;

            req.session.govName =
                results[0].name;

            console.log("Government login successful");

            return res.redirect('/gov');

        }

        res.send('Invalid Officer ID or Password');

    });

});


// =====================================
// FARMERS PAGE
// =====================================

router.get('/farmers', (req, res) => {

    if (!req.session.govLoggedIn) {
        return res.redirect('/gov/login');
    }

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'gov portal',
            'farmers.html'
        )
    );

});


// =====================================
// QUEUE PAGE
// =====================================

router.get('/queue', (req, res) => {

    if (!req.session.govLoggedIn) {
        return res.redirect('/gov/login');
    }

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'gov portal',
            'queue.html'
        )
    );

});


// =====================================
// PROCUREMENT PAGE
// =====================================

router.get('/procurement', (req, res) => {

    if (!req.session.govLoggedIn) {
        return res.redirect('/gov/login');
    }

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'gov portal',
            'procurement.html'
        )
    );

});


// =====================================
// SETTINGS PAGE
// =====================================

router.get('/settings', (req, res) => {

    if (!req.session.govLoggedIn) {
        return res.redirect('/gov/login');
    }

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'gov portal',
            'settings.html'
        )
    );

});


// =====================================
// LOGOUT
// =====================================

router.get('/logout', (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.log(err);

            return res.send('Logout failed');

        }

        res.redirect('/gov/login');

    });

});


// =====================================
// GET ALL FARMERS
// =====================================

router.get('/api/farmers', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }

    const sql = `
        SELECT
            id,
            name,
            mobile,
            village,
            created_at
        FROM farmers
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: 'Database error'
            });

        }

        res.json(results);

    });

});


// =====================================
// GET PROCUREMENT QUEUE
// =====================================
//
// Queue priority:
//
// 1. Preferred Date - earliest first
// 2. Preferred Time - earliest first
// 3. Token Number - smaller token first
//
// Any procurement record, including
// Rejected records, is removed from queue.
// =====================================

router.get('/api/queue', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }

    const sql = `
        SELECT
            r.id AS token,
            f.name,
            r.crop_type,
            r.product_weight,
            r.preferred_date,
            r.time_slot
        FROM registrations r
        JOIN farmers f
            ON r.farmer_id = f.id
        LEFT JOIN procurement p
            ON r.id = p.registration_id
        WHERE p.id IS NULL
        ORDER BY
            r.preferred_date ASC,
            r.time_slot ASC,
            r.id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(
                "Queue database error:",
                err
            );

            return res.status(500).json({
                message: 'Database error'
            });

        }

        res.json(results);

    });

});


// =====================================
// GET FARMER BY TOKEN
// =====================================

router.get('/api/procurement/:token', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }

    const token = req.params.token;

    const sql = `
        SELECT
            r.id AS token,
            f.id AS farmer_id,
            f.name,
            f.village,
            r.crop_type,
            r.product_weight,
            r.preferred_date,
            r.time_slot
        FROM registrations r
        JOIN farmers f
            ON r.farmer_id = f.id
        WHERE r.id = ?
    `;

    db.query(sql, [token], (err, results) => {

        if (err) {

            console.log(
                "Procurement farmer error:",
                err
            );

            return res.status(500).json({
                message: 'Database error'
            });

        }

        if (results.length === 0) {

            return res.status(404).json({
                message: 'Farmer registration not found'
            });

        }

        res.json(results[0]);

    });

});


// ==========================================
// GET RECENT GOVERNMENT PROCUREMENT
// ==========================================

router.get('/api/procurement', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }

    const sql = `
        SELECT
            p.id,
            p.registration_id AS token,
            f.name AS farmer_name,
            p.crop_type,
            p.quantity,
            p.test_result,
            p.procurement_status,
            p.payment_status,
            p.total_amount,
            p.created_at
        FROM procurement p
        JOIN farmers f
            ON p.farmer_id = f.id
        ORDER BY p.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(
                "Recent procurement error:",
                err
            );

            return res.status(500).json({
                message: 'Database error'
            });

        }

        res.json(results);

    });

});


// ==========================================
// SAVE PROCUREMENT
// ==========================================

router.post('/api/procurement', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }

    const {
        token,
        farmerId,
        crop,
        quantity,
        quality,
        testResult,
        testedQuantity,
        remarks,
        rate,
        totalAmount,
        paymentStatus,
        procurementStatus
    } = req.body;


    // ======================================
    // VALIDATION
    // ======================================

    if (!token || !farmerId || !crop || !quantity) {

        return res.status(400).json({
            message: 'Required details are missing'
        });

    }


    // ======================================
    // VALIDATE TEST RESULT
    // ======================================

    const allowedTestResults = [
        'Pending',
        'Passed',
        'Rejected'
    ];

    if (
        testResult &&
        !allowedTestResults.includes(testResult)
    ) {

        return res.status(400).json({
            message: 'Invalid test result'
        });

    }


    // ======================================
    // CHECK IF ALREADY PROCESSED
    // ======================================

    const checkSql = `
        SELECT id
        FROM procurement
        WHERE registration_id = ?
        LIMIT 1
    `;

    db.query(
        checkSql,
        [token],
        (checkErr, checkResults) => {

            if (checkErr) {

                console.log(
                    "Check procurement error:",
                    checkErr
                );

                return res.status(500).json({
                    message: 'Database error'
                });

            }


            // ==================================
            // ALREADY PROCESSED
            // ==================================

            if (checkResults.length > 0) {

                return res.status(400).json({

                    message:
                        'This farmer has already completed procurement.'

                });

            }


            // ======================================
            // FINAL PROCUREMENT VALUES
            // ======================================
            //
            // IMPORTANT:
            //
            // If test result is Rejected:
            //
            // Procurement Status = Rejected
            // Payment Status     = Not Paid
            // Accepted Quantity  = 0
            // Total Amount       = 0
            //
            // The values sent by the frontend
            // cannot override these rules.
            // ======================================

            let finalTestResult =
                testResult || 'Pending';

            let finalPaymentStatus =
                paymentStatus || 'Pending';

            let finalProcurementStatus =
                procurementStatus || 'Processing';

            let finalAcceptedQuantity =
                testedQuantity || null;

            let finalTotalAmount =
                totalAmount || null;


            // ======================================
            // REJECTED TEST RESULT
            // ======================================

            if (finalTestResult === 'Rejected') {

                finalPaymentStatus =
                    'Not Paid';

                finalProcurementStatus =
                    'Rejected';

                finalAcceptedQuantity =
                    0;

                finalTotalAmount =
                    0;

            }


            // ======================================
            // PASSED TEST RESULT
            // ======================================

            if (finalTestResult === 'Passed') {

                // If procurement is completed,
                // payment can be processed.
                //
                // If frontend sends "Completed",
                // keep it.
                //
                // Otherwise default to Processing.

                if (
                    procurementStatus === 'Completed'
                ) {

                    finalProcurementStatus =
                        'Completed';

                } else {

                    finalProcurementStatus =
                        'Processing';

                }


                // Payment can only be Paid
                // when procurement is Completed.

                if (
                    finalProcurementStatus === 'Completed' &&
                    paymentStatus === 'Paid'
                ) {

                    finalPaymentStatus =
                        'Paid';

                } else {

                    finalPaymentStatus =
                        'Pending';

                }

            }


            // ======================================
            // PENDING TEST RESULT
            // ======================================

            if (finalTestResult === 'Pending') {

                finalProcurementStatus =
                    'Processing';

                finalPaymentStatus =
                    'Pending';

            }


            // ==================================
            // INSERT PROCUREMENT
            // ==================================

            const sql = `
                INSERT INTO procurement (

                    registration_id,
                    farmer_id,
                    crop_type,
                    quantity,
                    quality_grade,
                    test_result,
                    accepted_quantity,
                    remarks,
                    rate_per_kg,
                    total_amount,
                    payment_status,
                    procurement_status

                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;


            const values = [

                token,
                farmerId,
                crop,
                quantity,
                quality || null,
                finalTestResult,
                finalAcceptedQuantity,
                remarks || null,
                rate || null,
                finalTotalAmount,
                finalPaymentStatus,
                finalProcurementStatus

            ];


            db.query(
                sql,
                values,
                (err, result) => {

                    if (err) {

                        console.log(
                            "Save procurement error:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                'Failed to save procurement'
                        });

                    }


                    console.log(
                        "Procurement saved for token:",
                        token
                    );


                    res.json({

                        message:
                            'Procurement saved successfully',

                        procurementId:
                            result.insertId,

                        testResult:
                            finalTestResult,

                        procurementStatus:
                            finalProcurementStatus,

                        paymentStatus:
                            finalPaymentStatus

                    });

                }
            );

        }
    );

});


// ==========================================
// GOVERNMENT DASHBOARD DATA
// ==========================================

router.get('/api/dashboard', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }


    // ======================================
    // FARMERS REGISTERED TODAY
    // ======================================

    const farmersTodaySql = `

        SELECT COUNT(DISTINCT farmer_id) AS count

        FROM registrations

        WHERE DATE(created_at) = CURDATE()

    `;


    // ======================================
    // CURRENTLY WAITING
    // ======================================

    const waitingSql = `

        SELECT COUNT(*) AS count

        FROM registrations r

        LEFT JOIN procurement p
            ON r.id = p.registration_id

        WHERE p.id IS NULL

    `;


    // ======================================
    // COMPLETED
    // ======================================

    const completedSql = `

        SELECT COUNT(*) AS count

        FROM procurement

        WHERE procurement_status = 'Completed'

    `;


    // ======================================
    // CURRENT QUEUE FARMER
    // ======================================

    const currentQueueSql = `

        SELECT
            r.id AS token,
            f.name,
            r.crop_type,
            r.product_weight,
            r.preferred_date,
            r.time_slot

        FROM registrations r

        JOIN farmers f
            ON r.farmer_id = f.id

        LEFT JOIN procurement p
            ON r.id = p.registration_id

        WHERE p.id IS NULL

        ORDER BY
            r.preferred_date ASC,
            r.time_slot ASC,
            r.id ASC

        LIMIT 1

    `;


    // ======================================
    // RUN FARMERS TODAY QUERY
    // ======================================

    db.query(
        farmersTodaySql,
        (err, todayResult) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Database error'
                });

            }


            // ==================================
            // RUN WAITING QUERY
            // ==================================

            db.query(
                waitingSql,
                (err, waitingResult) => {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            message: 'Database error'
                        });

                    }


                    // ==================================
                    // RUN COMPLETED QUERY
                    // ==================================

                    db.query(
                        completedSql,
                        (err, completedResult) => {

                            if (err) {

                                console.log(err);

                                return res.status(500).json({
                                    message: 'Database error'
                                });

                            }


                            // ==================================
                            // RUN CURRENT QUEUE QUERY
                            // ==================================

                            db.query(
                                currentQueueSql,
                                (err, queueResult) => {

                                    if (err) {

                                        console.log(err);

                                        return res.status(500).json({
                                            message:
                                                'Database error'
                                        });

                                    }


                                    // ==================================
                                    // CONVERT DATABASE VALUES
                                    // ==================================

                                    const farmersToday =
                                        Number(
                                            todayResult[0].count
                                        );

                                    const currentlyWaiting =
                                        Number(
                                            waitingResult[0].count
                                        );

                                    const completed =
                                        Number(
                                            completedResult[0].count
                                        );


                                    // ==================================
                                    // DAILY CAPACITY
                                    // ==================================

                                    const dailyCapacity = 300;

                                    const remaining =
                                        Math.max(
                                            dailyCapacity -
                                            farmersToday,
                                            0
                                        );

                                    const capacityPercent =
                                        Math.min(
                                            Math.round(
                                                (
                                                    farmersToday /
                                                    dailyCapacity
                                                ) * 100
                                            ),
                                            100
                                        );


                                    // ==================================
                                    // SEND DASHBOARD DATA
                                    // ==================================

                                    res.json({

                                        farmersToday:
                                            farmersToday,

                                        currentlyWaiting:
                                            currentlyWaiting,

                                        completed:
                                            completed,

                                        remaining:
                                            remaining,

                                        capacityPercent:
                                            capacityPercent,

                                        currentQueue:
                                            queueResult.length > 0
                                                ? queueResult[0]
                                                : null,

                                        officerName:
                                            req.session.govName ||
                                            'Government Officer',

                                        officerId:
                                            req.session.govOfficerId ||
                                            'GOV001'

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;