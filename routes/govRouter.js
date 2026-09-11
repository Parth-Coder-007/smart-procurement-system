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
        path.join(
            __dirname,
            '..',
            'view',
            'gov portal',
            'index.html'
        )
    );

});


// =====================================
// LOGIN PAGE
// =====================================

router.get('/login', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'gov portal',
            'login.html'
        )
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

    db.query(
        sql,
        [officerId, password],
        (err, results) => {

            if (err) {

                console.log(
                    "Government login error:",
                    err
                );

                return res.send(
                    'Database error'
                );

            }

            if (results.length > 0) {

                req.session.govLoggedIn = true;

                req.session.govOfficerId =
                    results[0].officer_id;

                req.session.govName =
                    results[0].name;

                console.log(
                    "Government login successful"
                );

                return res.redirect('/gov');

            }

            res.send(
                'Invalid Officer ID or Password'
            );

        }
    );

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

    req.session = null;

    res.redirect('/gov/login');

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

    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.log(
                    "Get farmers error:",
                    err
                );

                return res.status(500).json({
                    message: 'Database error'
                });

            }

            res.json(results);

        }
    );

});


// =====================================
// GET PROCUREMENT QUEUE
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

        AND NOT EXISTS (
            SELECT 1
            FROM skipped_registrations s
            WHERE s.registration_id = r.id
        )

        ORDER BY

            r.preferred_date ASC,

            STR_TO_DATE(
                TRIM(
                    SUBSTRING_INDEX(
                        r.time_slot,
                        ' - ',
                        1
                    )
                ),
                '%h:%i %p'
            ) ASC,

            r.id ASC
    `;

    db.query(
        sql,
        (err, results) => {

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

        }
    );

});


// =====================================
// SKIP FARMER
// =====================================

router.post('/api/queue/skip', (req, res) => {

    if (!req.session.govLoggedIn) {

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }

    const { token } = req.body;

    if (!token) {

        return res.status(400).json({
            message: 'Token is required'
        });

    }


    // =====================================
    // CHECK PROCUREMENT
    // =====================================

    const checkSql = `
        SELECT id
        FROM procurement
        WHERE registration_id = ?
        LIMIT 1
    `;

    db.query(
        checkSql,
        [token],
        (err, results) => {

            if (err) {

                console.log(
                    "Check skip farmer error:",
                    err
                );

                return res.status(500).json({
                    message: 'Database error'
                });

            }


            if (results.length > 0) {

                return res.status(400).json({
                    message:
                        'This farmer has already completed procurement.'
                });

            }


            // =====================================
            // CHECK ALREADY SKIPPED
            // =====================================

            const checkSkippedSql = `
                SELECT id
                FROM skipped_registrations
                WHERE registration_id = ?
                LIMIT 1
            `;

            db.query(
                checkSkippedSql,
                [token],
                (skipCheckErr, skipResults) => {

                    if (skipCheckErr) {

                        console.log(
                            "Check skipped farmer error:",
                            skipCheckErr
                        );

                        return res.status(500).json({
                            message: 'Database error'
                        });

                    }


                    if (skipResults.length > 0) {

                        return res.status(400).json({
                            message:
                                'This farmer has already been skipped.'
                        });

                    }


                    // =====================================
                    // INSERT SKIPPED FARMER
                    // =====================================

                    const skipSql = `
                        INSERT INTO skipped_registrations
                        (registration_id)
                        VALUES (?)
                    `;

                    db.query(
                        skipSql,
                        [token],
                        (insertErr, result) => {

                            if (insertErr) {

                                console.log(
                                    "Skip farmer error:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    message:
                                        'Failed to skip farmer'
                                });

                            }


                            console.log(
                                "Farmer skipped. Token:",
                                token
                            );


                            res.json({

                                success: true,

                                message:
                                    'Farmer skipped successfully',

                                token: token

                            });

                        }
                    );

                }
            );

        }
    );

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

    db.query(
        sql,
        [token],
        (err, results) => {

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
                    message:
                        'Farmer registration not found'
                });

            }

            res.json(results[0]);

        }
    );

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
            p.accepted_quantity,
            p.rate_per_kg,
            p.total_amount,
            p.test_result,
            p.procurement_status,
            p.payment_status,
            p.created_at

        FROM procurement p

        JOIN farmers f
            ON p.farmer_id = f.id

        ORDER BY p.id DESC
    `;

    db.query(
        sql,
        (err, results) => {

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

        }
    );

});


// ==========================================
// SAVE PROCUREMENT
// ==========================================
//
// IMPORTANT:
//
// quantity = farmer registered quantity
//
// accepted_quantity = quantity actually accepted
//
// total_amount = accepted_quantity × rate_per_kg
//
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
        paymentStatus,
        procurementStatus
    } = req.body;


    // ======================================
    // BASIC VALIDATION
    // ======================================

    if (
        !token ||
        !farmerId ||
        !crop ||
        !quantity
    ) {

        return res.status(400).json({
            message:
                'Required details are missing'
        });

    }


    const registeredQuantity =
        Number(quantity);


    const acceptedQuantity =
        Number(testedQuantity);


    const ratePerKg =
        Number(rate);


    // ======================================
    // VALIDATE REGISTERED QUANTITY
    // ======================================

    if (
        isNaN(registeredQuantity) ||
        registeredQuantity <= 0
    ) {

        return res.status(400).json({
            message:
                'Invalid registered quantity'
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


    const finalTestResult =
        testResult || 'Pending';


    if (
        !allowedTestResults.includes(
            finalTestResult
        )
    ) {

        return res.status(400).json({
            message:
                'Invalid test result'
        });

    }


    // ======================================
    // CHECK ALREADY PROCESSED
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


            if (checkResults.length > 0) {

                return res.status(400).json({

                    message:
                        'This farmer has already completed procurement.'

                });

            }


            // ======================================
            // FINAL VALUES
            // ======================================

            let finalPaymentStatus =
                paymentStatus || 'Pending';


            let finalProcurementStatus =
                procurementStatus || 'Processing';


            let finalAcceptedQuantity;

            let finalRate;

            let finalTotalAmount;


            // ======================================
            // REJECTED
            // ======================================

            if (
                finalTestResult === 'Rejected'
            ) {

                finalPaymentStatus =
                    'Not Paid';

                finalProcurementStatus =
                    'Rejected';

                finalAcceptedQuantity =
                    0;

                finalRate =
                    null;

                finalTotalAmount =
                    0;

            }


            // ======================================
            // PASSED
            // ======================================

            else if (
                finalTestResult === 'Passed'
            ) {

                // Accepted quantity required

                if (
                    isNaN(acceptedQuantity) ||
                    acceptedQuantity < 0
                ) {

                    return res.status(400).json({
                        message:
                            'Please enter a valid accepted quantity.'
                    });

                }


                // Accepted quantity cannot exceed
                // registered quantity

                if (
                    acceptedQuantity >
                    registeredQuantity
                ) {

                    return res.status(400).json({

                        message:
                            'Accepted quantity cannot be greater than registered quantity.'

                    });

                }


                // Rate required

                if (
                    isNaN(ratePerKg) ||
                    ratePerKg < 0
                ) {

                    return res.status(400).json({
                        message:
                            'Please enter a valid rate per kg.'
                    });

                }


                finalAcceptedQuantity =
                    acceptedQuantity;


                finalRate =
                    ratePerKg;


                // ==================================
                // IMPORTANT
                // TOTAL = ACCEPTED × RATE
                // ==================================

                finalTotalAmount =
                    acceptedQuantity *
                    ratePerKg;


                // Procurement status

                if (
                    procurementStatus === 'Completed'
                ) {

                    finalProcurementStatus =
                        'Completed';

                } else {

                    finalProcurementStatus =
                        'Processing';

                }


                // Payment status

                if (
                    finalProcurementStatus ===
                        'Completed' &&
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
            // PENDING
            // ======================================

            else {

                if (
                    !isNaN(acceptedQuantity) &&
                    acceptedQuantity >= 0
                ) {

                    if (
                        acceptedQuantity >
                        registeredQuantity
                    ) {

                        return res.status(400).json({

                            message:
                                'Accepted quantity cannot be greater than registered quantity.'

                        });

                    }

                    finalAcceptedQuantity =
                        acceptedQuantity;

                } else {

                    finalAcceptedQuantity =
                        null;

                }


                if (
                    !isNaN(ratePerKg) &&
                    ratePerKg >= 0
                ) {

                    finalRate =
                        ratePerKg;

                } else {

                    finalRate =
                        null;

                }


                // Calculate only if both values exist

                if (
                    finalAcceptedQuantity !== null &&
                    finalRate !== null
                ) {

                    finalTotalAmount =
                        finalAcceptedQuantity *
                        finalRate;

                } else {

                    finalTotalAmount =
                        null;

                }


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

                registeredQuantity,

                quality || null,

                finalTestResult,

                finalAcceptedQuantity,

                remarks || null,

                finalRate,

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


                    console.log(
                        "Registered Quantity:",
                        registeredQuantity
                    );


                    console.log(
                        "Accepted Quantity:",
                        finalAcceptedQuantity
                    );


                    console.log(
                        "Rate:",
                        finalRate
                    );


                    console.log(
                        "Total Amount:",
                        finalTotalAmount
                    );


                    res.json({

                        message:
                            'Procurement saved successfully',

                        procurementId:
                            result.insertId,

                        testResult:
                            finalTestResult,

                        registeredQuantity:
                            registeredQuantity,

                        acceptedQuantity:
                            finalAcceptedQuantity,

                        ratePerKg:
                            finalRate,

                        totalAmount:
                            finalTotalAmount,

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

        AND NOT EXISTS (
            SELECT 1
            FROM skipped_registrations s
            WHERE s.registration_id = r.id
        )

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

        AND NOT EXISTS (
            SELECT 1
            FROM skipped_registrations s
            WHERE s.registration_id = r.id
        )

        ORDER BY

            r.preferred_date ASC,

            STR_TO_DATE(
                TRIM(
                    SUBSTRING_INDEX(
                        r.time_slot,
                        ' - ',
                        1
                    )
                ),
                '%h:%i %p'
            ) ASC,

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
                    message:
                        'Database error'
                });

            }


            // ==================================
            // WAITING
            // ==================================

            db.query(
                waitingSql,
                (err, waitingResult) => {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            message:
                                'Database error'
                        });

                    }


                    // ==================================
                    // COMPLETED
                    // ==================================

                    db.query(
                        completedSql,
                        (err, completedResult) => {

                            if (err) {

                                console.log(err);

                                return res.status(500).json({
                                    message:
                                        'Database error'
                                });

                            }


                            // ==================================
                            // CURRENT QUEUE
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

                                    const dailyCapacity =
                                        300;


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
                                    // RESPONSE
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


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;