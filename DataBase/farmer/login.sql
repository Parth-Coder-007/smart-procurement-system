CREATE DATABASE IF NOT EXISTS khetsetu;
USE khetsetu;

CREATE TABLE farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

INSERT INTO farmers (email, password)
VALUES
('parthmore782@gmail.com', '12456'),
('farmer01@gmail.com', 'farmer123'),
('farmer02@gmail.com', 'farmer456'),
('farmer03@gmail.com', 'farmer789'),
('farmer04@gmail.com', 'farm1234'),
('farmer05@gmail.com', 'farm5678'),
('farmer06@gmail.com', 'farm9012'),
('farmer07@gmail.com', 'khet1234'),
('farmer08@gmail.com', 'khet5678'),
('farmer09@gmail.com', 'khet9012');

SELECT * FROM farmers;