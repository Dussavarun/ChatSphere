import express from "express";
import { createGroupController } from "../controllers/creating.Group.controller.js";
import { fetchGroupList } from "../controllers/fetchGroupListController.js";
import { groupchatname } from "../controllers/getgroupname.js";
import { fetchgroupmessages } from "../controllers/fetching.groupmessages.js";
import { groupfilesharecontroller } from "../controllers/group.fileshare.multer.controller.js";
const router = express.Router();

router.post('/createGroup' , createGroupController)
router.post('/groupsList' , fetchGroupList)
//remember always set ensure the names match in the api endpoints while fetching any data
router.get('/groupmessages/:groupchatId' , fetchgroupmessages);
router.post('/fileupload' , groupfilesharecontroller);
router.get('/:id',groupchatname)
export default router;
