//require ('dotenv').config({path:"./env"});
import dotenv from 'dotenv';

import connectDB from './db/index.js';
dotenv.config({
  path : "./env"
})



connectDB()
.then(()=>{
  app.on("Error",(error)=>{
    console.log("The following error occured",error);
    throw error;
  })
  app.listen(process.env.PORT  || 8000,()=>{
    console.log("App is running on port", `${process.env.PORT}`)
  })
})
.catch((error)=>{
  console.log("connectio,n has failed to database", error);
}
);

/*import express from "express";

const app = express();

(async()=>{

    try {

      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on("error", (error)=>{
        console.log("error", error);
        throw error;
      });
      app.listen(process.env.PORT,()=>{
        console.log(`The application is listening on ${process.env.PORT}`)
      })
        
    } catch (error) {
        console.log("Erroor",error);
        throw error;
    }
})();*/