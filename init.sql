CREATE DATABASE IF NOT EXISTS `wechat_auto_reply` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE `wechat_auto_reply`;

CREATE TABLE IF NOT EXISTS `reply_app` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT '应用名称',
  `token` varchar(255) NOT NULL COMMENT '应用令牌',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `reply_rule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rule` varchar(255) NOT NULL COMMENT '规则名称',
  `match_type` int NOT NULL COMMENT '匹配方式',
  `app_id` int NOT NULL COMMENT '所属应用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `app_id` (`app_id`),
  CONSTRAINT `reply_rule_ibfk_1` FOREIGN KEY (`app_id`) REFERENCES `reply_app` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `reply_target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_id` int DEFAULT NULL COMMENT '所属应用',
  `rule_id` int DEFAULT NULL COMMENT '所属规则',
  `content` varchar(2000) COLLATE utf8mb4_general_ci NOT NULL COMMENT '回复内容',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `rule_id` (`rule_id`),
  KEY `app_id` (`app_id`),
  CONSTRAINT `reply_target_ibfk_1` FOREIGN KEY (`rule_id`) REFERENCES `reply_rule` (`id`),
  CONSTRAINT `reply_target_ibfk_2` FOREIGN KEY (`app_id`) REFERENCES `reply_app` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;