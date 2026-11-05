-- MariaDB dump 10.19  Distrib 10.4.21-MariaDB, for osx10.10 (x86_64)
--
-- Host: localhost    Database: foodhub
-- ------------------------------------------------------
-- Server version	10.4.21-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `foodhub`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `foodhub` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `foodhub`;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `menu_items` (
  `item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` enum('Mains','Sides','Drinks','Desserts') NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(6,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `idx_menu_category` (`category`,`is_available`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,'Hainanese chicken rice','Mains','Poached chicken, fragrant rice, chilli sauce',8.60,'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Hainanese_chicken_rice_in_Singapore.jpg/960px-Hainanese_chicken_rice_in_Singapore.jpg',1,'2026-10-18 14:58:31'),(2,'Beef rendang bowl','Mains','Slow-cooked beef in rich coconut spices, served with rice',12.00,'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Beef_Rendang..JPG/960px-Beef_Rendang..JPG',1,'2026-10-18 14:58:31'),(3,'Curry laksa','Mains','Spicy coconut broth, prawns, tofu puffs',7.20,'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Curry_Laksa_served_in_Kuala_Lumpur.jpg/960px-Curry_Laksa_served_in_Kuala_Lumpur.jpg',1,'2026-10-18 14:58:31'),(4,'Char kway teow','Mains','Wok-fried flat rice noodles with prawns, egg and chives',6.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Char_Kway_Teow_%281%29.jpg/960px-Char_Kway_Teow_%281%29.jpg',1,'2026-10-18 14:58:31'),(5,'Crispy fries','Sides','Golden fries seasoned with sea salt and herbs',3.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Truffle_oil_french_fries_%2833024792848%29.jpg/960px-Truffle_oil_french_fries_%2833024792848%29.jpg',1,'2026-10-18 14:58:31'),(6,'Vegetable spring rolls','Sides','Crisp rolls with sweet chilli dipping sauce',4.20,'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Golden_Vegetable_Spring_Rolls_Served_with_Dipping_Sauce.jpg/960px-Golden_Vegetable_Spring_Rolls_Served_with_Dipping_Sauce.jpg',1,'2026-10-18 14:58:31'),(7,'Chicken satay','Sides','Grilled skewers with peanut sauce and onion',6.00,'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/CHICKEN_SATAY.jpg/960px-CHICKEN_SATAY.jpg',1,'2026-10-18 14:58:31'),(8,'Onion rings','Sides','Light, crunchy battered onion rings',3.80,'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Hand-Made_Crispy_Onion_Rings.jpg/960px-Hand-Made_Crispy_Onion_Rings.jpg',1,'2026-10-18 14:58:31'),(9,'Iced lemon tea','Drinks','Black tea over ice with fresh lemon',2.20,'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Iced_lemon_tea_-_Rawlab_Juice_%26_Tea.jpg/960px-Iced_lemon_tea_-_Rawlab_Juice_%26_Tea.jpg',1,'2026-10-18 14:58:31'),(10,'Teh tarik','Drinks','Frothy pulled milk tea',2.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Teh_tarik_3.jpg/960px-Teh_tarik_3.jpg',1,'2026-10-18 14:58:31'),(11,'Fresh orange juice','Drinks','Freshly squeezed, no added sugar',3.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/960px-Orange_juice_1_edit1.jpg',1,'2026-10-18 14:58:31'),(12,'Iced white coffee','Drinks','Smooth white coffee served over ice',3.20,'https://upload.wikimedia.org/wikipedia/commons/f/f1/A_glass_of_Ipoh_iced_white_coffee.jpg',1,'2026-10-18 14:58:31'),(13,'Mango sticky rice','Desserts','Ripe mango, coconut cream',4.80,'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Mango_sticky_rice_served_in_Thailand.jpg/960px-Mango_sticky_rice_served_in_Thailand.jpg',1,'2026-10-18 14:58:31'),(14,'Chendol','Desserts','Shaved ice, pandan jelly, coconut milk and gula melaka',4.20,'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Chendol_in_Malaysia_-_December_2016.jpg/960px-Chendol_in_Malaysia_-_December_2016.jpg',1,'2026-10-18 14:58:31'),(15,'Chocolate brownie','Desserts','Rich fudgy brownie squares',3.90,'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Chocolate_brownies_without_table.jpg/960px-Chocolate_brownies_without_table.jpg',1,'2026-10-18 14:58:31'),(16,'Blueberry cheesecake','Desserts','Creamy baked cheesecake with blueberry topping',10.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/New_York_cheesecake_2.jpg/960px-New_York_cheesecake_2.jpg',1,'2026-10-18 14:58:31'),(17,'Nasi lemak','Mains','Coconut rice with sambal, fried egg, anchovies and peanuts',6.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Nasi_lemak_joh.jpg/960px-Nasi_lemak_joh.jpg',1,'2026-10-18 14:58:31'),(18,'Popiah','Sides','Fresh rolls filled with turnip, egg and crisp vegetables',4.50,'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Popiah_cu.JPG/960px-Popiah_cu.JPG',1,'2026-10-18 14:58:31'),(19,'Bandung','Drinks','Rose syrup milk served over ice',2.80,'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Syrup_Bandung_with_Cincau.jpg/960px-Syrup_Bandung_with_Cincau.jpg',1,'2026-10-18 14:58:31'),(20,'Tiramisu','Desserts','Coffee-soaked sponge layered with mascarpone cream',5.80,'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Tiramisu_dessert.jpg/960px-Tiramisu_dessert.jpg',1,'2026-10-18 14:58:31');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `order_item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `unit_price` decimal(6,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_item` (`item_id`),
  CONSTRAINT `fk_order_items_item` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,2,5.50),(2,1,9,2,2.20),(3,2,3,2,7.20),(4,2,5,1,3.50),(5,2,10,1,2.50),(6,3,1,3,5.50),(7,3,9,3,2.20),(8,3,13,2,4.80),(9,4,2,2,9.80),(10,4,6,2,4.20),(11,4,14,1,4.20),(12,5,1,2,5.50),(13,5,3,2,7.20),(14,5,11,2,3.50),(15,6,4,2,6.50),(16,6,7,2,6.00),(17,6,9,2,2.20),(18,7,1,4,5.50),(19,7,5,3,3.50),(20,7,15,2,3.90),(21,8,3,3,7.20),(22,8,9,2,2.20),(23,8,8,2,3.80),(24,9,1,3,5.50),(25,9,5,2,3.50),(26,9,12,2,3.20),(27,10,2,3,9.80),(28,10,3,2,7.20),(29,10,9,2,2.20),(30,10,16,1,5.50),(31,11,1,3,5.50),(32,11,6,2,4.20),(33,11,10,2,2.50),(34,12,3,2,7.20),(35,12,5,3,3.50),(36,12,9,3,2.20),(37,12,13,2,4.80),(38,13,4,2,6.50),(39,13,7,2,6.00),(40,13,11,1,3.50),(41,13,15,2,3.90),(42,14,10,10,2.50),(43,14,14,2,4.20),(44,15,1,1,5.50),(45,15,13,1,4.80),(46,15,8,1,3.80),(47,15,12,1,3.20),(48,16,5,5,3.50),(49,16,15,3,3.90),(50,17,19,7,2.80),(53,22,14,3,4.20),(54,22,15,1,3.90),(55,22,13,2,4.80),(56,22,20,1,5.80),(58,25,5,1,3.50),(60,28,2,2,9.80),(61,29,4,1,6.50),(62,30,2,1,12.00),(63,30,7,1,6.00),(64,31,2,1,12.00),(65,32,2,1,12.00),(66,33,16,1,10.50);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `order_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `order_date` datetime NOT NULL DEFAULT current_timestamp(),
  `delivery_address` varchar(255) NOT NULL,
  `contact_phone` varchar(20) NOT NULL,
  `payment_method` enum('cash','card','paynow') NOT NULL DEFAULT 'cash',
  `notes` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Preparing','Out for delivery','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  `total_amount` decimal(8,2) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`order_id`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,2,'2026-09-18 14:58:31','Blk 123 Ang Mo Kio Ave 3, #05-27, Singapore 560123','91234567','cash',NULL,'Delivered',15.40,'2026-10-18 14:58:31'),(2,3,'2026-09-20 14:58:31','45 Jurong West St 42, #12-08, Singapore 640045','98765432','card','Less spicy please','Delivered',20.40,'2026-10-18 14:58:31'),(3,4,'2026-09-22 14:58:31','Blk 88 Tampines St 82, #03-15, Singapore 520088','87654321','paynow',NULL,'Delivered',32.70,'2026-10-18 14:58:31'),(4,5,'2026-09-24 14:58:31','12 Bukit Timah Road, #07-02, Singapore 259761','96543210','cash',NULL,'Delivered',32.20,'2026-10-18 14:58:31'),(5,6,'2026-09-27 14:58:31','Blk 301 Yishun Ring Rd, #10-44, Singapore 760301','81122334','card','Leave at the door','Delivered',32.40,'2026-10-18 14:58:31'),(6,2,'2026-09-30 14:58:31','Blk 123 Ang Mo Kio Ave 3, #05-27, Singapore 560123','91234567','paynow',NULL,'Delivered',29.40,'2026-10-18 14:58:31'),(7,3,'2026-10-03 14:58:31','45 Jurong West St 42, #12-08, Singapore 640045','98765432','cash',NULL,'Delivered',40.30,'2026-10-18 14:58:31'),(8,4,'2026-10-06 14:58:31','Blk 88 Tampines St 82, #03-15, Singapore 520088','87654321','card',NULL,'Delivered',33.60,'2026-10-18 14:58:31'),(9,5,'2026-10-09 14:58:31','12 Bukit Timah Road, #07-02, Singapore 259761','96543210','paynow','Ring the bell twice','Delivered',29.90,'2026-10-18 14:58:31'),(10,6,'2026-10-12 14:58:31','Blk 301 Yishun Ring Rd, #10-44, Singapore 760301','81122334','cash',NULL,'Delivered',53.70,'2026-10-18 14:58:31'),(11,2,'2026-10-15 14:58:31','Blk 123 Ang Mo Kio Ave 3, #05-27, Singapore 560123','91234567','card',NULL,'Out for delivery',29.90,'2026-10-18 14:58:31'),(12,3,'2026-10-16 14:58:31','45 Jurong West St 42, #12-08, Singapore 640045','98765432','paynow',NULL,'Pending',41.10,'2026-11-03 19:35:21'),(13,4,'2026-10-17 14:58:31','Blk 88 Tampines St 82, #03-15, Singapore 520088','87654321','cash','No chilli','Pending',36.30,'2026-10-18 14:58:31'),(14,5,'2026-10-08 14:58:31','12 Bukit Timah Road, #07-02, Singapore 259761','96543210','cash','Changed my mind','Cancelled',33.40,'2026-10-18 14:58:31'),(15,6,'2026-10-18 14:58:31','Blk 301 Yishun Ring Rd, #10-44, Singapore 760301','81122334','card',NULL,'Pending',17.30,'2026-10-18 14:58:31'),(16,7,'2026-10-18 15:06:57','none','86460165','card','?','Out for delivery',29.20,'2026-11-03 21:19:26'),(17,7,'2026-10-20 20:03:44','i dont want to give you','86460165','card',NULL,'Out for delivery',19.60,'2026-11-03 20:56:32'),(22,8,'2026-10-21 00:23:33','nah nah','86460165','cash','no way','Cancelled',31.90,'2026-10-21 00:25:34'),(25,11,'2026-10-21 11:06:02','hi','88888888','cash',NULL,'Delivered',3.50,'2026-10-21 11:07:20'),(28,1,'2026-10-27 18:15:25','1 Raffles Place, Singapore 048616','81234567','cash',NULL,'Pending',19.60,'2026-10-27 18:15:25'),(29,7,'2026-10-27 18:16:18','ffff','86460165','cash',NULL,'Cancelled',6.50,'2026-10-27 18:46:01'),(30,14,'2026-11-04 09:05:49','dfasdf','88888888','cash',NULL,'Out for delivery',18.00,'2026-11-04 09:09:00'),(31,11,'2026-11-04 09:06:39','j','88888888','cash',NULL,'Cancelled',12.00,'2026-11-04 09:07:07'),(32,15,'2026-11-04 09:33:22','Block 65, #04-1349A, 34 Nanyang Crescent, Singapore 637634','88888888','cash',NULL,'Pending',12.00,'2026-11-04 09:33:22'),(33,15,'2026-11-04 09:33:41','Block 65, #04-1349A, 34 Nanyang Crescent, Singapore 637634','88888888','cash',NULL,'Preparing',10.50,'2026-11-04 09:39:11');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin FoodHub','admin@foodhub.test','81234567','1 Raffles Place, Singapore 048616','$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy','admin','2026-10-18 14:58:31'),(2,'Aisha Lim','aisha@example.com','91234567','Blk 123 Ang Mo Kio Ave 3, #05-27, Singapore 560123','$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy','customer','2026-10-18 14:58:31'),(3,'Daniel Tan','daniel@example.com','98765432','45 Jurong West St 42, #12-08, Singapore 640045','$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy','customer','2026-10-18 14:58:31'),(4,'Priya Nair','priya@example.com','87654321','Blk 88 Tampines St 82, #03-15, Singapore 520088','$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy','customer','2026-10-18 14:58:31'),(5,'Marcus Wong','marcus@example.com','96543210','12 Bukit Timah Road, #07-02, Singapore 259761','$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy','customer','2026-10-18 14:58:31'),(6,'Sofia Rahman','sofia@example.com','81122334','Blk 301 Yishun Ring Rd, #10-44, Singapore 760301','$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy','customer','2026-10-18 14:58:31'),(7,'Oswin','oswin9089@gmail.com','86460165',NULL,'$2y$10$hDIlbkbtkPZbxVXO/vaeBuNGkU4j7Yopx41H5pDMPFQOlXd9ONT7e','customer','2026-10-18 15:05:46'),(8,'Oswin','ch0005ai@e.ntu.edu.sg','86460165','Block 65, #04-1349A, 34 Nanyang Crescent, Singapore 637634','$2y$10$5cWGq880KzmG0sohArxI4O/ok3.t3YASDCi3idp019lYGfK6Dj.6.','customer','2026-10-21 00:22:33'),(11,'bryan','bmr200604@gmail.com','88888888',NULL,'$2y$10$KNNY3Q2IqzzWn6W4NYU69.gJ.uNeP5qGLnAWo.cE/EvcuX4yPzdQC','customer','2026-10-21 11:03:01'),(12,'Grace CC','grace908933@gmail.com','88882222',NULL,'$2y$10$qET6j3yKy37J3dJv1YhYfOq2UgPGG2UDUtC57.GPRov8uO7ZR2P4u','customer','2026-11-03 19:03:15'),(13,'Oswin','oswin90822222@gmail.com','83937212',NULL,'$2y$10$DytYafEXALW8ccG03EDI0uBB/xJxLtTYplb0PI/sD2BPzBxRohUCi','customer','2026-11-03 20:50:06'),(14,'testbryan','testbryan@gmail.com','88888888','dfasdf','$2y$10$QvJtJE9Whm/8M62ljhHTneab6yrgW7tjp4ie8U58YCmctrpm8ikE6','customer','2026-11-04 09:02:29'),(15,'bryanprod','bryan.matthew.rustardy@gmail.com','88888888','Block 65, #04-1349A, 34 Nanyang Crescent, Singapore 637634','$2y$10$oTx8tDlITi7/zXUvwOV/2eUEtcU9QFVplTM8mRz6qEckleG5NT47K','customer','2026-11-04 09:31:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-05 16:26:33
