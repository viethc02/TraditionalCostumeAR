import express, { Router } from "express";
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject  } from "firebase/storage";
import multer from "multer";
import config from "../config/firebase.config"
//import fs from "fs";

const router: Router = express.Router();

//Initialize a firebase application
initializeApp(config.firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() });

var http = require('http');
var https = require('https');
var fs = require('fs');

router.post("/", upload.single("filename"), async (req, res) => {
    try {
        const dateTime = giveCurrentDateTime();

        //const storageRef = ref(storage, `files/${req.file.originalname + "       " + dateTime}`);
        const storageRef = ref(storage, `files/${req.file.originalname}`);

        // Create file metadata including the content type
        const metadata = {
            contentType: req.file.mimetype,
        };

        // Upload the file in the bucket storage
        const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
        //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

        // Grab the public url
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('File successfully uploaded.');
        return res.send({
            message: 'file uploaded to firebase storage',
            name: req.file.originalname,
            type: req.file.mimetype,
            downloadURL: downloadURL
        })
    } catch (error) {
        return res.status(400).send(error.message)
    }
});

router.get('/', async (req, res) => {
    try {
        var name = req.query.name;
        //console.log(req)
        var storageRef = ref(storage, `files/${name}`);
        var filePath = await getDownloadURL(storageRef); // The default name the browser will use
        //res.download(`files/${name}`);
        const file = fs.createWriteStream('mesh.obj');
        const request = https.get(filePath, (response) =>{
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                console.log("download complete.")
            } );
        })

        console.log('File successfully downloaded.');
        return res.send({
            name: name,
            message: 'file downloaded',
            file: filePath
        })
    }
    catch (error) {
        return res.status(400).send(error.message)
    }
});

router.delete('/', async (req, res) => {
    var name = req.query.name;
    const desertRef = ref(storage, `files/${name}`);
    // Delete the file
    deleteObject(desertRef).then(() => {
        // File deleted successfully
        }).catch((error) => {
            return res.status(400).send(error.message)
        });
    return res.send({
        name: name,
        message: 'file deleted',
    })
});


const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + ' ' + time;
    return dateTime;
}

export default router;