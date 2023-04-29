import { initializeApp } from "firebase/app";
import { addDoc, collection, doc, getDocs, getFirestore, query, where, documentId, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject  } from "firebase/storage";
import config from "../config/firebase.config"
import { pick } from "lodash";
import express, { Router, Request, Response } from "express";
const router: Router = express.Router();

// Initialize Firebase
const app = initializeApp(config.firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const storage = getStorage();

// Get reference to employee collection
const meshRef = collection(db, "mesh");

//Add new Employee
router.post('/', async (req: Request, res: Response) => {
    try {
        const mesh = pick(req.body, ['name', 'detail', 'url']);
        const storageRef = ref(storage, `files/${mesh.name}`);
        if (mesh.url == null) {
            const filePath = await getDownloadURL(storageRef);
            mesh.url = filePath;
        }
        var docRef = await setDoc(doc(db, 'mesh', mesh.name), mesh);
        console.log("Document written with ID: ", mesh);
        return res.send('New employee added to DB.')
    } catch (e) {
        return res.status(400).send(e.message)
    }
})

//Get records of all employees
router.get('/', async (req: Request, res: Response) => {
    try {
        const querySnapshot = await getDocs(meshRef);
        const records = [];
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            records.push(doc.data());
        });
        return res.send({
            'employees records': records
        });
    } catch (err) {
        res.status(400).send(err.message);
    }
})

// Get employee by Id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const meshId = req.params.id

        const q = query(meshRef, where(documentId(), "==", meshId));
        // const q = query(employeesRef, where("isPermanent", "==", true));

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return res.send(`Employee with id ${meshId} does not exists.`)
        }
        const employeeRecord = querySnapshot.docs[0].data();
        res.send({
            'Employee record': employeeRecord
        })
    } catch (error) {
        res.status(400).send(error.message)
    }
})

// edit employee records 
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const employeeId = req.params.id;
        const UpdatedEmployee = pick(req.body, ['name', 'age', 'position', 'isPermanent']);
        const q = query(meshRef, where(documentId(), "==", employeeId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return res.send(`Employee with id ${employeeId} does not exists.`)
        }
        //updateDoc can update single or multiple fields
        await updateDoc(doc(db, "employee", employeeId), UpdatedEmployee);
        res.send('Employee record edited.')
    } catch (error) {
        res.status(400).send(error.message)
    }
})

// Delete employee records 
router.delete('/', async (req: Request, res: Response) => {
    try {
        const meshName = req.query.name;
        console.log(meshName);
        await deleteDoc(doc(db, "mesh", `${meshName}`));
        return res.send(`${meshName} is deleted.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
})

export default router;