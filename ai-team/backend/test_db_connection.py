# library to connect to mysql database wth xampp
import mysql.connector

#  Declaring variabls to connect to phpmyadmin
SERVERNAME = "localhost"
USERNAME = "root"
PASSWORD = ""
DB = "" # we'll create it using sql script file execution
PORT = 3308


def connect_db():
    try:
        conn = mysql.connector.connect(
            host= SERVERNAME,
            user= USERNAME,
            password = PASSWORD,
            database= DB,
            port=PORT
        )
        print("Connectig to  Database")
        conn.database = "magasin"
        cursor = conn.cursor()
        query = "SELECT * FROM client LIMIT 5;"
        cursor.execute(query)
        results = cursor.fetchall()
        for row in results:
            print(row)

    except Exception as e:
        print(f"Error in connecting to the database :  {e}")


if __name__ == "__main__":
    connect_db()