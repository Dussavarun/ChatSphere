import express from "express";
import { createGroupController } from "../controllers/creating.Group.controller.js";
import { fetchGroupList } from "../controllers/fetchGroupListController.js";
const router = express.Router();

router.post('/createGroup' , createGroupController)
router.post('/groupsList' , fetchGroupList)



export default router;
