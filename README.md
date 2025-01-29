**WEB APP**

**To run the app locally:**

**Pre-requisites**

* Install latest Node.js. Verify the versions using below commands:
  * node -v
  * npm -v
* Install latest MySQL (To run the app locally)  
  
**Installation**

* Clone the repository using git command: git clone git@github.com:CSYE-6225Spring-2025/webapp.git
* Navigate to webapp directory using git CLI (git bash): cd webapp
* Install dependencies (dotenv, express, sequelize) using git command: npm install
* Create .env file and set below paramaters:
    * DB_NAME=<database_name>
    * DB_USER=<your_db_username>
    * DB_PASS=<your_db_password>
    * DB_HOST=localhost
    * DB_DIALECT=mysql
* Run the app using command: node index.js