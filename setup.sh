#!/bin/sh

read -p "Se till att ha node, npm och mysql installerat innan det här skriptet körs.
Innan servern körs måste det finnas en användare med tillgång till en databas
(som båda specifieras snart).

Exempelvis kan detta användas:

sudo mysql
CREATE USER IF NOT EXISTS 'användarnamn'@'localhost' IDENTIFIED WITH mysql_native_password BY 'lösenord';
CREATE DATABASE IF NOT EXISTS databas;
GRANT ALL ON databas.* TO 'användarnamn'@'localhost';


Men beroende på version av mysql så måste kanske 'WITH mysql_native_password'
måste tas bort, annars kan inte nodejs ansluta till databasen.


Tryck enter för att fortsätta " yn

read -p "SMTP-host: " SMTP_HOST
read -p "SMTP-port: " SMTP_PORT
read -p "SMTP-användarnamn: " SMTP_USERNAME

stty -echo
read -p "SMTP-lösenord: " SMTP_PASSWORD
stty echo

echo

read -p "MYSQL-host: " MYSQL_HOST
read -p "MYSQL-databas: " MYSQL_DATABASE
read -p "MYSQL-användarnamn: " MYSQL_USERNAME
read -p "MYSQL-lösenord: " MYSQL_PASSWORD

echo "{
	\"smtp\": {
		\"user\": \"$SMTP_USERNAME\",
		\"pass\": \"$SMTP_PASSWORD\",
		\"host\": \"$SMTP_HOST\",
		\"port\": \"$SMTP_PORT\"
	},
	\"mysql\": {
		\"user\": \"$MYSQL_USERNAME\",
		\"pass\": \"$MYSQL_PASSWORD\",
		\"database\": \"$MYSQL_DATABASE\",
		\"host\": \"$MYSQL_DATABASE\"
	}
}
" > creds.json

echo "Sparat i creds.json"

echo "Installerar server-depencencies..."

npm i

echo "Insallerar frontend-dependencies..."

cd client/
npm i

echo "Bygger frontend"

npm run build
cd ../

echo "Allt klart, skriv npm start för att starta servern";
