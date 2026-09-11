-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: khetsetu
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `farmers`
--

DROP TABLE IF EXISTS `farmers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `district` varchar(100) NOT NULL,
  `village` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `land_area` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=123457 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmers`
--

LOCK TABLES `farmers` WRITE;
/*!40000 ALTER TABLE `farmers` DISABLE KEYS */;
INSERT INTO `farmers` VALUES (213,'Parth Vishwas More','parthmore98475@gmail.com','9833766115','Parth#123','Mumbai','Mumbai','New Prabhadevi',200.00,'2026-09-10 10:40:47'),(612,'Rohit Perane','rohitperane21@gmail.com','9356842154','ROHIT21','Raigad','neral','Priadarshani Rahivashi Sangh,\r\nRamabai Ambedkar Nagar,\r\nDurgamata Temple,\r\nGhatkopar,\r\nVTC: Mumbai,\r\nPO: Pant Nagar,\r\nSub District: Ku',200.00,'2026-09-10 10:37:20'),(1955,'sanklap rathod','sankalprathod2007@gmail.com','7588443556','S@nk@lp','Mumbai','wadala','madhacolony swssapnapurti buildings no.2',1000.00,'2026-09-10 10:26:12'),(2000,'Atmaram Bhide','bhide827@gmail.com','9833765412','983376','Mumbai','abc','gokuldham',100.00,'2026-09-10 07:14:46'),(2343,'Archit','architpatil2302@gmail.com','8805544556','archit','Mumbai','wadala','Wadala',340.00,'2026-09-10 10:29:48'),(3000,'Jethalal Gada','jethalal827@gmail.com','9833766116','983376','Mumbai','abc','gokuldham',100.00,'2026-09-10 07:14:15'),(4000,'Champak Gada','champak827@gmail.com','5115656135','983376','Mumbai','abc','gokuldham',100.00,'2026-09-10 07:12:23'),(9845,'manish','parthmore0001@gmail.com','9833766146','123456','Mumbai','Mumbai','ed',50.00,'2026-09-10 15:08:07'),(9851,'Ganesh','parthmore0000@gmail.com','9833766145','123456','Mumbai','Mumbai','prabhadevi',50.00,'2026-09-10 15:06:29'),(12345,'Archit Patil','archit827@gmail.com','5115656121','983376','Thane','abc','v lsm',100.00,'2026-09-10 07:11:18'),(123456,'Asmita Bagad','asmitabagad@2007gmail.com','8010369051','Asmita@2007','Mumbai','kalyan','mellinium heights, shahad, kalyan ',10.00,'2026-09-10 10:34:04');
/*!40000 ALTER TABLE `farmers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `government_users`
--

DROP TABLE IF EXISTS `government_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `government_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `officer_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `officer_id` (`officer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `government_users`
--

LOCK TABLES `government_users` WRITE;
/*!40000 ALTER TABLE `government_users` DISABLE KEYS */;
INSERT INTO `government_users` VALUES (1,'GOV001','Government Officer','123456','2026-09-09 18:19:47');
/*!40000 ALTER TABLE `government_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `procurement`
--

DROP TABLE IF EXISTS `procurement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registration_id` int NOT NULL,
  `farmer_id` int NOT NULL,
  `crop_type` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `quality_grade` varchar(10) DEFAULT NULL,
  `test_result` varchar(20) DEFAULT NULL,
  `accepted_quantity` decimal(10,2) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `rate_per_kg` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'Pending',
  `procurement_status` varchar(20) DEFAULT 'Processing',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_id` (`registration_id`),
  KEY `farmer_id` (`farmer_id`),
  CONSTRAINT `procurement_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `procurement_ibfk_2` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement`
--

LOCK TABLES `procurement` WRITE;
/*!40000 ALTER TABLE `procurement` DISABLE KEYS */;
INSERT INTO `procurement` VALUES (9,1,4000,'Rice',5000.00,'A','Passed',1976.00,'Good Quality',20.00,100000.00,'Paid','Completed','2026-09-10 07:18:52'),(10,3,12345,'Wheat',5094.00,'A','Passed',5000.00,'Good',10.00,50940.00,'Pending','Completed','2026-09-10 07:19:45'),(11,5,1955,'Maize',925.00,'A','Rejected',-20.00,'Bad Quality',0.00,0.00,'Pending','Rejected','2026-09-10 10:44:41'),(12,6,2343,'Soybean',100.00,'A','Passed',100.00,'GOOD FIXING',70.00,7000.00,'Paid','Completed','2026-09-10 10:48:00'),(13,7,123456,'Wheat',100.00,'A','Rejected',35.00,'Good Qality',50.00,5000.00,'Paid','Rejected','2026-09-10 14:21:29'),(14,8,612,'Rice',159.00,'A','Rejected',0.00,'Avrage',5.00,0.00,'Not Paid','Rejected','2026-09-10 14:33:06'),(15,4,2000,'Wheat',2988.00,'A','Rejected',0.00,'Bad quality',NULL,0.00,'Not Paid','Rejected','2026-09-10 14:39:57');
/*!40000 ALTER TABLE `procurement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int NOT NULL,
  `district` varchar(100) NOT NULL,
  `procurement_centre` varchar(150) NOT NULL,
  `crop_type` varchar(100) NOT NULL,
  `product_weight` decimal(10,2) NOT NULL,
  `preferred_date` date NOT NULL,
  `time_slot` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `farmer_id` (`farmer_id`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES (1,4000,'Mumbai','Mumbai Central Procurement Centre','Rice',5000.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 07:15:21'),(2,3000,'Mumbai','Sion Procurement Centre','Wheat',5000.00,'2026-09-11','10:00 AM - 11:00 AM','2026-09-10 07:16:05'),(3,12345,'Mumbai','Mumbai Central Procurement Centre','Wheat',5094.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 07:16:40'),(4,2000,'Mumbai','Mumbai Central Procurement Centre','Wheat',2988.00,'2026-09-10','11:00 AM - 12:00 PM','2026-09-10 07:17:13'),(5,1955,'Mumbai','Mumbai Central Procurement Centre','Bajra',925.00,'2020-11-12','10:00 AM - 11:00 AM','2026-09-10 10:27:24'),(6,2343,'Mumbai','Mumbai Central Procurement Centre','Soybean',100.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 10:31:08'),(7,123456,'Mumbai','Mumbai Central Procurement Centre','Bajra',100.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 10:35:13'),(8,612,'Mumbai','Mumbai Central Procurement Centre','Rice',159.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 10:38:36'),(9,213,'Mumbai','Mumbai Central Procurement Centre','Jowar',2000.00,'2026-09-10','11:00 AM - 12:00 PM','2026-09-10 10:42:00'),(10,9851,'Mumbai','Mumbai Central Procurement Centre','Rice',5000.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 15:07:06'),(11,9845,'Mumbai','Mumbai Central Procurement Centre','Wheat',4982.00,'2026-09-10','10:00 AM - 11:00 AM','2026-09-10 15:08:40');
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-10 23:04:23
CREATE TABLE skipped_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    skipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (registration_id)
        REFERENCES registrations(id)
        ON DELETE CASCADE
);