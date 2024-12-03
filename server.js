import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
// Middleware to parse JSON
app.use(bodyParser.json());

const database = new sqlite3.Database('C:\\Users\\sirpl\\Downloads\\Backend server\\sqlite (4).db', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database');
    }
  });

async function runQuery(query, parameters =[]){

    return new Promise((resolve, reject) => {
        database.run(query, parameters, function(err){

            if(err) reject(err);
            else resolve(this.lastID);
        });
    });
}

app.use((req, res, next) => { //cors bypass policy

    res.header('Access-Control-Allow-Origin', '*');  
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); 
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if(req.method == 'OPTIONS'){
        
        return res.status(200).end();
    }

    next();

});

app.get('/test', (req, res) => { //tests that the server can send a get request
    res.send('Server is working!');
});

app.post('/submit-YLdata', async (req, res) => {
    try{

        console.log('Form type:', req.body[0].name);
        console.log('full form:', req.body);

        const formData = req.body;
        const formType = req.body[0].name;
        const address_Insert = `INSERT INTO ADDRESS (STREET_ADD, CITY, ZIP, STATE) VALUES (?, ?, ?, ?)`;
        const student_Insert = `INSERT INTO STUDENT (CLUB_ID, SCHOOL_ID, ADDRESS_ID, FIRST_NAME, LAST_NAME, PHONE_NUM, GRAD_YEAR) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const guardian_Insert =  `INSERT INTO GUARDIAN (STUDENT_ID, ADDRESS_ID, FIRST_NAME, LAST_NAME, PHONE_NUM, EMAIL) VALUES (?, ?, ?, ?, ?, ?)`;
        const leader_Insert = `INSERT INTO LEADER (CLUB_ID, FIRST_NAME, LAST_NAME, PHONE_NUM, EMAIL) VALUES (?, ?, ?, ?, ?)`;
        const event_Insert =`INSERT INTO EVENT (ADDRESS_ID, CLUB_ID, EVENT_NAME, EVENT_DATE) VALUES (?, ?, ?, ?)`;


        if(formType == 'studentRegistration'){

            var i = 1;
            const student_Address = formData[i ++];
            var guardian_Address = null;
            if(formData.length > 4){
                guardian_Address = formData[i ++];
            }

            const student = formData[i ++];
            const guardian = formData[i];

            let student_AddressID = null;
            let guardian_AddressID = null;
            let student_ID = null;
            let guardian_ID = null;

            //insert into the student address table

            student_AddressID = await runQuery(address_Insert,[
                student_Address.STREET_ADD,
                student_Address.CITY,
                student_Address.ZIP,
                student_Address.STATE

            ]);

            console.log('students address ID:', student_AddressID);

            //insert into the student table

            student_ID = await runQuery(student_Insert, [
                student.CLUB_ID,
                student.SCHOOL_ID,
                student_AddressID,
                student.FIRST_NAME,
                student.LAST_NAME,
                student.PHONE_NUM,
                student.GRAD_YEAR
            ]);

            console.log('students ID', student_ID);


            //if guardian_Address is seperate submit guardian address into address table

            if(guardian_Address){

                guardian_AddressID = await runQuery(address_Insert, [
                    guardian_Address.STREET_ADD,
                    guardian_Address.CITY,
                    guardian_Address.ZIP,
                    guardian_Address.STATE

                ]);
            }
            else{ //if not use student address id
                guardian_AddressID = student_AddressID;
            }

            console.log('guardians address ID', guardian_AddressID);

            //submit into guardian table
            guardian_ID = await runQuery(guardian_Insert, [

                student_ID,
                guardian_AddressID,
                guardian.FIRST_NAME,
                guardian.LAST_NAME,
                guardian.PHONE_NUM,
                guardian.EMAIL
            ])

            console.log('guardian ID', guardian_ID);


            
        } 

        else if(formType === 'leaderRegistration'){
            //insert leader information
            const leader_info = formData[1];
            let leaderID = await runQuery(leader_Insert, [
                leader_info.CLUB_ID,
                leader_info.FIRST_NAME,
                leader_info.LAST_NAME,
                leader_info.PHONE_NUM,
                leader_info.EMAIL
            ]);
            console.log('LeaderID:', leaderID);
        }

        else if(formType === 'eventCreation'){
            
            const event_information = formData[1];
            const event_address = formData[2];

            let event_AddressID = null;
            event_AddressID = await runQuery(address_Insert, [

                event_address.STREET_ADD,
                event_address.CITY,
                event_address.ZIP,
                event_address.STATE

            ]);

            let eventID = await runQuery(event_Insert, [

                event_AddressID,
                event_information.CLUB_ID,
                event_information.EVENT_NAME,
                event_information.EVENT_DATE,

            ]);
        }

        return res.status(200).json({ message: 'Data received successfully', receivedData: formData});
    }
    catch(error){

        console.error('error submitting data: ', error);
        return res.status(500).json({

            message: 'there was an error submitting the data',
            error: error.response?.data || error.message,
        });
    }

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});