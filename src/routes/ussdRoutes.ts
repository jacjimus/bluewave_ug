import express from 'express';
import ussdMenuBuilder from '../menu-builder'
import { db } from '../models/db'


const router = express.Router()



router.post('/', async (req, res) => {
    console.log(req.body)
    let menu_res: any;

    try{

      // RUN THE MENU BUILDER
      // PASS REQ BODY AND REDIS CLIENT
        menu_res = await ussdMenuBuilder(req.body, db);
      
    } catch(e){
        console.log("MENU ERROR", e);
        return res.send(e)
        
    }
    res.send(menu_res);
})


module.exports = router