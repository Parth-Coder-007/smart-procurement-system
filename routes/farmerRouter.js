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
// FARMER LOGIN PAGE
// =====================================

router.get('/login', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'farmer portal',
            'login.html'
        )
    );

});


// =====================================
// FARMER LOGIN
// =====================================

router.post('/', (req, res) => {

    const { email, password } = req.body;

    const sql = `
        SELECT
            id,
            name,
            email,
            mobile,
            district,
            village,
            address,
            land_area
        FROM farmers
        WHERE email = ? AND password = ?
    `;

    db.query(sql, [email, password], (err, result) => {

        if (err) {

            console.log("Login database error:", err);

            return res.status(500).send("Database error");

        }

        if (result.length === 0) {

            console.log("Invalid email or password");

            return res.status(401).send(
                "Invalid email or password"
            );

        }

        const farmer = result[0];

        // Save logged-in farmer ID in session
        req.session.farmerId = farmer.id;

        console.log("--------------------------------");
        console.log("LOGIN SUCCESSFUL");
        console.log("Farmer ID:", farmer.id);
        console.log("Farmer Name:", farmer.name);
        console.log("Farmer Email:", farmer.email);
        console.log(
            "Session Farmer ID:",
            req.session.farmerId
        );
        console.log("--------------------------------");

        res.redirect('/farmer/dashboard');

    });

});


// =====================================
// FARMER DASHBOARD
// =====================================

router.get('/dashboard', (req, res) => {

    if (!req.session.farmerId) {

        return res.redirect('/farmer/login');

    }

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'farmer portal',
            'farmer.html'
        )
    );

});


// =====================================
// GET CURRENT FARMER PROFILE
// =====================================

router.get('/profile', (req, res) => {

    const farmerId = req.session.farmerId;

    console.log(
        "Profile requested for Farmer ID:",
        farmerId
    );

    if (!farmerId) {

        return res.status(401).json({
            message: "Please login first"
        });

    }

    const sql = `
        SELECT
            id,
            name,
            email,
            mobile,
            district,
            village,
            address,
            land_area
        FROM farmers
        WHERE id = ?
    `;

    db.query(
        sql,
        [farmerId],
        (err, result) => {

            if (err) {

                console.log(
                    "Profile database error:",
                    err
                );

                return res.status(500).json({
                    message: "Database error"
                });

            }

            if (result.length === 0) {

                return res.status(404).json({
                    message: "Farmer not found"
                });

            }

            console.log(
                "Sending profile for Farmer ID:",
                result[0].id
            );

            res.json(result[0]);

        }
    );

});


// =====================================
// FARMER SIGNUP PAGE
// =====================================

router.get('/signup', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'view',
            'farmer portal',
            'signup.html'
        )
    );

});


// =====================================
// FARMER SIGNUP
// =====================================

router.post('/signup', (req, res) => {

    const {
        farmer_id,
        name,
        email,
        mobile,
        password,
        confirmPassword,
        district,
        village,
        address,
        land_area
    } = req.body;


    // Password check
    if (password !== confirmPassword) {

        return res.status(400).send(
            "Passwords do not match"
        );

    }


    const sql = `
        INSERT INTO farmers
        (
            id,
            name,
            email,
            mobile,
            password,
            district,
            village,
            address,
            land_area
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            farmer_id,
            name,
            email,
            mobile,
            password,
            district,
            village,
            address,
            land_area
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "Signup database error:",
                    err
                );

                if (err.code === 'ER_DUP_ENTRY') {

                    return res.status(400).send(
                        "Farmer ID, email or mobile number is already registered"
                    );

                }

                return res.status(500).send(
                    "Signup failed"
                );

            }


            console.log(
                "Farmer account created successfully"
            );

            console.log(
                "Farmer ID:",
                farmer_id
            );

            console.log(
                "Farmer Name:",
                name
            );


            res.redirect('/farmer/login');

        }
    );

});


// =====================================
// CROP REGISTRATION
// =====================================

router.post('/register', (req, res) => {

    // Get current logged-in farmer
    const farmerId = req.session.farmerId;

    console.log(
        "Registration requested by Farmer ID:",
        farmerId
    );


    // Check login
    if (!farmerId) {

        return res.status(401).json({
            message: "Please login first"
        });

    }


    const {
        district,
        procurement_centre,
        crop_type,
        product_weight,
        preferred_date,
        time_slot
    } = req.body;


    // Check required fields
    if (
        !district ||
        !procurement_centre ||
        !crop_type ||
        !product_weight ||
        !preferred_date ||
        !time_slot
    ) {

        return res.status(400).json({
            message: "Please fill all required fields"
        });

    }


    // =====================================
    // FIND CURRENT QUEUE POSITION
    // =====================================

    const countSql = `
        SELECT COUNT(*) AS total
        FROM registrations
        WHERE
            procurement_centre = ?
            AND preferred_date = ?
            AND time_slot = ?
    `;


    db.query(
        countSql,
        [
            procurement_centre,
            preferred_date,
            time_slot
        ],
        (err, countResult) => {

            if (err) {

                console.log(
                    "Queue count error:",
                    err
                );

                return res.status(500).json({
                    message: "Database error"
                });

            }


            const position =
                countResult[0].total + 1;


            // =====================================
            // INSERT REGISTRATION
            // =====================================

            const insertSql = `
                INSERT INTO registrations
                (
                    farmer_id,
                    district,
                    procurement_centre,
                    crop_type,
                    product_weight,
                    preferred_date,
                    time_slot
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;


            db.query(
                insertSql,
                [
                    farmerId,
                    district,
                    procurement_centre,
                    crop_type,
                    product_weight,
                    preferred_date,
                    time_slot
                ],
                (err, result) => {

                    if (err) {

                        console.log(
                            "Registration database error:",
                            err
                        );

                        return res.status(500).json({
                            message: "Database error"
                        });

                    }


                    const registrationId =
                        result.insertId;


                    const token =
                        "KS-" +
                        String(registrationId).padStart(4, "0");


                    const total =
                        position;


                    console.log("--------------------------------");
                    console.log("REGISTRATION SUCCESSFUL");
                    console.log(
                        "Farmer ID:",
                        farmerId
                    );
                    console.log(
                        "Registration ID:",
                        registrationId
                    );
                    console.log(
                        "Token:",
                        token
                    );
                    console.log(
                        "Queue Position:",
                        position
                    );
                    console.log("--------------------------------");


                    res.json({

                        message:
                            "Registration successful",

                        token: token,

                        position: position,

                        total: total

                    });

                }
            );

        }
    );

});


// =====================================
// REGISTRATION HISTORY
// =====================================

router.get('/registrations', (req, res) => {

    const farmerId = req.session.farmerId;


    if (!farmerId) {

        return res.status(401).json({
            message: "Please login first"
        });

    }


    const sql = `
        SELECT
            id,
            CONCAT(
                'KS-',
                LPAD(id, 4, '0')
            ) AS token,
            district,
            procurement_centre,
            crop_type,
            product_weight,
            preferred_date,
            time_slot,
            created_at
        FROM registrations
        WHERE farmer_id = ?
        ORDER BY id DESC
    `;


    db.query(
        sql,
        [farmerId],
        (err, result) => {

            if (err) {

                console.log(
                    "Registration history error:",
                    err
                );

                return res.status(500).json({
                    message: "Database error"
                });

            }


            console.log(
                "Registrations found for Farmer ID:",
                farmerId
            );

            console.log(result);


            res.json(result);

        }
    );

});


// =====================================
// LOGOUT
// =====================================

router.get('/logout', (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.log(
                "Logout error:",
                err
            );

            return res.status(500).send(
                "Logout failed"
            );

        }


        res.clearCookie('connect.sid');

        res.redirect('/farmer/login');

    });

});
// ==========================================
// GET FARMER PROCUREMENT DETAILS
// ==========================================

router.get('/api/procurement', (req, res) => {

    if (!req.session.farmerId) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    const sql = `
        SELECT
            p.id,
            p.registration_id AS token,
            p.crop_type,
            p.quantity,
            p.quality_grade,
            p.test_result,
            p.accepted_quantity,
            p.remarks,
            p.rate_per_kg,
            p.total_amount,
            p.payment_status,
            p.procurement_status,
            p.created_at
        FROM procurement p
        WHERE p.farmer_id = ?
        ORDER BY p.id DESC
    `;

    db.query(sql, [req.session.farmerId], (err, results) => {

        if (err) {
            console.log("Farmer procurement error:", err);

            return res.status(500).json({
                message: 'Database error'
            });
        }

        res.json(results);
    });
});


// ==========================================
// LIVE FARMER QUEUE
// ==========================================

router.get('/api/queue', (req, res) => {

    if (!req.session.farmerId) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    const farmerId = req.session.farmerId;

    // Get latest registration of logged-in farmer
    const farmerSql = `
        SELECT
            r.id AS token,
            r.district,
            r.procurement_centre,
            r.crop_type,
            r.product_weight,
            r.preferred_date,
            r.time_slot,

            CASE
                WHEN p.id IS NULL THEN 'Waiting'
                ELSE p.procurement_status
            END AS queue_status

        FROM registrations r

        LEFT JOIN procurement p
            ON r.id = p.registration_id

        WHERE r.farmer_id = ?

        ORDER BY r.id DESC

        LIMIT 1
    `;


    db.query(farmerSql, [farmerId], (err, farmerResult) => {

        if (err) {
            console.log("Farmer queue error:", err);

            return res.status(500).json({
                message: 'Database error'
            });
        }


        if (farmerResult.length === 0) {

            return res.json({
                registration: null
            });

        }


        const farmer = farmerResult[0];


        // If procurement is already completed,
        // farmer is no longer in active queue.
        if (farmer.queue_status !== 'Waiting') {

            return res.json({
                registration: farmer,
                position: 0,
                total: 0,
                completed: true
            });

        }


        // Count all ACTIVE registrations before this farmer
        const queueSql = `
            SELECT
                r.id
            FROM registrations r

            LEFT JOIN procurement p
                ON r.id = p.registration_id

            WHERE
                p.id IS NULL

                AND r.procurement_centre = ?

                AND r.preferred_date = ?

                AND (
                    r.time_slot < ?

                    OR (
                        r.time_slot = ?
                        AND r.id <= ?
                    )
                )

            ORDER BY
                r.time_slot ASC,
                r.id ASC
        `;


        db.query(
            queueSql,
            [
                farmer.procurement_centre,
                farmer.preferred_date,
                farmer.time_slot,
                farmer.time_slot,
                farmer.token
            ],
            (err, queueResult) => {

                if (err) {
                    console.log("Queue calculation error:", err);

                    return res.status(500).json({
                        message: 'Database error'
                    });
                }


                const position = queueResult.length;


                // Total active registrations
                const totalSql = `
                    SELECT COUNT(*) AS total
                    FROM registrations r

                    LEFT JOIN procurement p
                        ON r.id = p.registration_id

                    WHERE
                        p.id IS NULL
                        AND r.procurement_centre = ?
                        AND r.preferred_date = ?
                `;


                db.query(
                    totalSql,
                    [
                        farmer.procurement_centre,
                        farmer.preferred_date
                    ],
                    (err, totalResult) => {

                        if (err) {
                            console.log("Total queue error:", err);

                            return res.status(500).json({
                                message: 'Database error'
                            });
                        }


                        res.json({

                            registration: farmer,

                            position: position,

                            total: totalResult[0].total,

                            completed: false

                        });

                    }
                );

            }
        );

    });

});

// =====================================
// EXPORT
// =====================================

module.exports = router;