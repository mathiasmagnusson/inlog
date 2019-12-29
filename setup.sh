#!/bin/sh

read -p "Se till att ha node, npm och mysql installerat innan det här skriptet körs.
Tryck enter för att fortsätta " yn

read -p "SMTP-host: " SMTP_HOST

read -p "SMTP-port: " SMTP_PORT

read -p "SMTP-användarnamn: " SMTP_USERNAME

stty -echo
read -p "SMTP-lösenord: " SMTP_PASSWORD
stty echo

echo

read -p "MYSQL-lösenord (används både för registrering och använding av servern så kan vara vad som helst): " MYSQL_PASSWORD

echo "{
	\"smtp\": {
		\"user\": \"$SMTP_USERNAME\",
		\"pass\": \"$SMTP_PASSWORD\",
		\"host\": \"$SMTP_HOST\",
		\"port\": \"$SMTP_PORT\"
	},
	\"mysql\": {
		\"user\": \"inlog\",
		\"pass\": \"$MYSQL_PASSWORD\",
		\"database\": \"inlog\",
		\"host\": \"localhost\"
	}
}
" > creds.json

echo "Sparat i creds.json"

echo "Skapar databas i mysql..."

echo "
CREATE USER IF NOT EXISTS 'inlog'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
CREATE DATABASE IF NOT EXISTS inlog;
GRANT ALL ON inlog.* TO 'inlog'@'localhost';
USE inlog;
CREATE TABLE IF NOT EXISTS account (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	username VARCHAR(20) NOT NULL,
	email VARCHAR(40) NULL,
	password VARCHAR(60) NOT NULL
);
CREATE TABLE IF NOT EXISTS fav_num (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	account_id INT NOT NULL,
	num INT NOT NULL,
	FOREIGN KEY (account_id) REFERENCES account(id)
);
" | sudo mysql

echo "Installerar server-depencencies..."

npm i

echo "Insallerar frontend-dependencies..."

cd client/
npm i

echo "Bygger frontend"

npm run build
cd ../

echo "Allt klart, skriv npm start för att starta servern";
