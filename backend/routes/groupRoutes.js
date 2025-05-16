import express from "express";
import { createGroupController } from "../controllers/creating.Group.controller.js";
import { fetchGroupList } from "../controllers/fetchGroupListController.js";
import { groupchatname } from "../controllers/getgroupname.js";
import { fetchgroupmessages } from "../controllers/fetching.groupmessages.js";
const router = express.Router();

router.post('/createGroup' , createGroupController)
router.post('/groupsList' , fetchGroupList)
router.get('/:id',groupchatname)
router.get('/:groupName/messages' , fetchgroupmessages);

export default router;
