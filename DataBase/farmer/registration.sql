DROP DATABASE IF EXISTS khetsetu;

CREATE DATABASE khetsetu;

USE khetsetu;


-- =========================================
-- FARMERS TABLE
-- =========================================

CREATE TABLE farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    mobile VARCHAR(15) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    district VARCHAR(100) NOT NULL,

    village VARCHAR(100) NOT NULL,

    address VARCHAR(255) NOT NULL,

    land_area DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- REGISTRATIONS TABLE
-- =========================================

CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    farmer_id INT NOT NULL,

    district VARCHAR(100) NOT NULL,

    procurement_centre VARCHAR(150) NOT NULL,

    crop_type VARCHAR(100) NOT NULL,

    product_weight DECIMAL(10,2) NOT NULL,

    preferred_date DATE NOT NULL,

    time_slot VARCHAR(50) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id)
        REFERENCES farmers(id)
        ON DELETE CASCADE
);


-- =========================================
-- CHECK TABLES
-- =========================================

DESCRIBE farmers;

DESCRIBE registrations;

SELECT * FROM farmers;

SELECT * FROM registrations;
SELECT id, name, email
FROM farmers;