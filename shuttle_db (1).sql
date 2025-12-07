-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 07, 2025 at 07:16 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shuttle_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','driver','admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Driver', 'driver@gmail.com', 'driver', 'driver', '2025-12-05 17:22:34', '2025-12-05 17:22:34'),
(2, 'Admin', 'admin@gmail.com', 'admin', 'admin', '2025-12-05 17:22:34', '2025-12-05 17:22:34'),
(3, 'User', 'user@gmail.com', 'user', 'user', '2025-12-05 17:22:34', '2025-12-05 17:22:34');

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT 'fa-info-circle',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `description`, `icon`, `created_at`) VALUES
(11, 'Created schedule for Driver #1 on 2025-12-25', 'fa-calendar-plus', '2025-12-07 11:27:52'),
(12, 'Created schedule for Driver #1 on 2025-12-08', 'fa-calendar-plus', '2025-12-07 14:16:26'),
(13, 'New Announcement created', 'fa-bullhorn', '2025-12-07 14:35:37');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `driver_schedule_id` int NOT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `dropoff_location` varchar(255) NOT NULL,
  `status` enum('pending','accepted','cancelled','completed') DEFAULT 'pending',
  `payment_status` enum('unpaid','paid') DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`driver_schedule_id`),
  KEY `driver_schedule_id` (`driver_schedule_id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `driver_schedule_id`, `pickup_location`, `dropoff_location`, `status`, `payment_status`, `created_at`, `updated_at`) VALUES
(18, 3, 38, 'Bakakeng Phase 3 Entrance', 'Bakakeng Northern Boundary', 'accepted', 'paid', '2025-12-07 07:08:52', '2025-12-07 07:08:52');

-- --------------------------------------------------------

--
-- Table structure for table `driver_schedule`
--

DROP TABLE IF EXISTS `driver_schedule`;
CREATE TABLE IF NOT EXISTS `driver_schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `shuttle_id` int NOT NULL,
  `route_id` int NOT NULL,
  `shift_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_capacity` int NOT NULL DEFAULT '0',
  `status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `driver_id` (`driver_id`,`shift_date`,`start_time`),
  KEY `shuttle_id` (`shuttle_id`)
) ENGINE=MyISAM AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `driver_schedule`
--

INSERT INTO `driver_schedule` (`id`, `driver_id`, `shuttle_id`, `route_id`, `shift_date`, `start_time`, `end_time`, `max_capacity`, `status`, `created_at`, `updated_at`) VALUES
(37, 1, 3, 8, '2025-12-25', '07:30:00', '00:00:00', 0, 'scheduled', '2025-12-07 03:27:52', '2025-12-07 03:27:52');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `booking_id`, `amount`, `payment_date`, `payment_method`, `created_at`) VALUES
(13, 16, 25.00, '2025-12-07 03:40:45', 'online', '2025-12-07 03:40:45'),
(14, 17, 25.00, '2025-12-07 03:43:51', 'cash', '2025-12-07 03:43:51'),
(15, 18, 25.00, '2025-12-07 07:08:52', 'online', '2025-12-07 07:08:52');

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
CREATE TABLE IF NOT EXISTS `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `start_location` varchar(255) NOT NULL,
  `end_location` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `start_lat` decimal(10,8) DEFAULT '16.41639000',
  `start_lng` decimal(11,8) DEFAULT '120.59333000',
  `end_lat` decimal(10,8) DEFAULT '16.35777000',
  `end_lng` decimal(11,8) DEFAULT '120.61111000',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`id`, `name`, `start_location`, `end_location`, `created_at`, `updated_at`, `start_lat`, `start_lng`, `end_lat`, `end_lng`) VALUES
(8, 'Maryheights to Main', 'SLU Maryheights', 'SLU Main Campus', '2025-12-05 16:50:54', '2025-12-05 17:17:05', 16.41902033, 120.59711843, 16.38352089, 120.59243251),
(7, 'Main to Maryheights', 'SLU Main Campus', 'SLU Maryheights', '2025-12-05 15:33:54', '2025-12-05 17:16:48', 16.38352089, 120.59243251, 16.41902033, 120.59711843),
(10, 'SLU-SVP Waiting Shed', 'SLU MaryHeights', 'Waiting Shed', '2025-12-07 05:48:38', '2025-12-07 05:48:38', 16.38559314, 120.59220429, 16.38833826, 120.59104056),
(11, 'SLU To Holy Family Parish Church Bakakeng', 'SLU MaryHeights', 'Holy Family Parish Church Bakakeng', '2025-12-07 05:50:40', '2025-12-07 05:50:40', 16.38559314, 120.59220429, 16.39106056, 120.59046949),
(12, 'SLU MaryHeights to Bakakeng Norte', 'SLU MaryHeights', 'Bakakeng Norte', '2025-12-07 05:51:54', '2025-12-07 05:51:54', 16.38559314, 120.59220429, 16.39179356, 120.59068940),
(13, 'SLU MaryHeights to Bakakeng RichView', 'SLU MaryHeights', 'Bakakeng RichView', '2025-12-07 05:53:52', '2025-12-07 05:53:52', 16.38559314, 120.59220429, 16.39306031, 120.59068723),
(14, 'SLU MaryHeights to Green Summervile', 'Bakakeng Phase 3 Entrance', 'Bakakeng Northern Boundary', '2025-12-07 05:55:06', '2025-12-07 05:55:06', 16.38559314, 120.59220429, 16.39578307, 120.58995618),
(15, 'SLU MaryHeights to Bakakeng Rd Entrance', 'SLU MaryHeights', 'Bakakeng Rd Entrance', '2025-12-07 05:57:31', '2025-12-07 05:57:31', 16.38559314, 120.59220429, 16.39957314, 120.58905403),
(16, 'SLU MaryHeights to Blue Mountain Hotel', 'SLU MaryHeights', 'Blue Mountain Hotel', '2025-12-07 05:59:20', '2025-12-07 05:59:20', 16.38559314, 120.59220429, 16.40098082, 120.59125065),
(17, 'SLU MaryHeights To BGH', 'SLU MaryHeights', 'BGH', '2025-12-07 06:00:34', '2025-12-07 06:00:34', 16.38559314, 120.59220429, 16.40227545, 120.59584096),
(18, 'SLU MaryHeights to UP', 'SLU MaryHeights', 'UP', '2025-12-07 06:02:18', '2025-12-07 06:02:18', 16.38559314, 120.59220429, 16.40583763, 120.59959995),
(19, 'SLU MaryHeights to UC', 'SLU MaryHeights', 'UC', '2025-12-07 06:03:18', '2025-12-07 06:03:18', 16.38559314, 120.59220429, 16.40782835, 120.59799073),
(20, 'SLU MaryHeights to SSS', 'SLU MaryHeights', 'SSS', '2025-12-07 06:04:21', '2025-12-07 06:04:21', 16.38559314, 120.59220429, 16.41083099, 120.59741816),
(21, 'SLU MaryHeights to Tiongsan Harrison', 'SLU MaryHeights', 'Tiongsan Harrison', '2025-12-07 06:05:40', '2025-12-07 06:05:40', 16.38559314, 120.59220429, 16.41294996, 120.59537166);

-- --------------------------------------------------------

--
-- Table structure for table `shuttles`
--

DROP TABLE IF EXISTS `shuttles`;
CREATE TABLE IF NOT EXISTS `shuttles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plate_number` varchar(20) NOT NULL,
  `capacity` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `current_lat` decimal(10,8) DEFAULT '16.41639000',
  `current_lng` decimal(11,8) DEFAULT '120.59333000',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plate_number` (`plate_number`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `shuttles`
--

INSERT INTO `shuttles` (`id`, `plate_number`, `capacity`, `created_at`, `updated_at`, `current_lat`, `current_lng`, `last_updated`) VALUES
(1, 'M2M-007', 20, '2025-12-03 15:59:05', '2025-12-05 15:46:29', 16.41639000, 120.59333000, '2025-12-03 15:59:05'),
(2, 'M2M-008', 30, '2025-12-03 15:59:05', '2025-12-05 15:46:27', 16.41639000, 120.59333000, '2025-12-03 15:59:05'),
(3, 'BRAVO-101', 25, '2025-12-03 15:59:05', '2025-12-05 15:57:21', 16.41639000, 120.59333000, '2025-12-03 15:59:05');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
