import * as queryService from "../models/queryService.js";
import { changeAccountName } from "../models/hiworksService.js";
import express from "express";
import { idMisMatchCheck } from "../models/doSearchService.js";
import logger from "../config/logger.js";

export const queryRouter = express.Router();

queryRouter.post("/getSender", async (req, res) => {
  try {
    const senderList = await queryService.getSender();
    res.send(senderList);
  } catch (error) {
    logger.error(`queryRouter.post("/getSender: "` + error);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getOneSender", async (req, res) => {
  const { senderId } = req.body;
  try {
    const senderName = await queryService.getOneSender(senderId);
    res.send(senderName);
  } catch (error) {
    logger.error(`queryRouter.post("/getOneSender: "` + error);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/changeSenderName", async (req, res) => {
  try {
    const { name, no } = req.body;

    const result = await queryService.updateMailAgent(name, no);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(`queryRouter.post("/changeSenderName": ` + error);
    res.status(200).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/addManual", async (req, res) => {
  try {
    // it's request from front-end each id
    const { no: senderNo, idList: listOfId, mySocketId } = req.body;
    let unSubscribe = [];

    const domainIdList = await idMisMatchCheck(listOfId, mySocketId);

    const idList = domainIdList.map((obj) => obj.id);

    const isSent = await queryService.realTimeIdCheck(idList, senderNo);

    if (isSent.length === 0) {
      // unSubscribe = await queryService.checkUnsubscribe(domainIdList);
      unSubscribe = await queryService.checkUnsubscribe(idList);
    }

    if (unSubscribe.length == 0) {
      return res.status(200).send(domainIdList);
    } else {
      return res.status(200).send(unSubscribe);
    }
  } catch (error) {
    logger.error("queryRouter.post('/addManual': " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getSenderEmail", async (req, res) => {
  const senderNo = req.body.no;
  try {
    const result = await queryService.getSenderEmail(senderNo);
    res.json(result);
  } catch (error) {
    logger.error("queryRouter.post('/getPasswordList': " + error);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/addSenderMail", async (req, res) => {
  const { newId, newPw } = req.body;
  try {
    const result = await queryService.addSenderMail(newId, newPw);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/addGmail: " + error);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/addBlackList", async (req, res) => {
  const { id, date } = req.body;
  try {
    const result = await queryService.addBlackList(id, date);

    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/addBlackList: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/deleteSender", async (req, res) => {
  const senderEmail = req.body.senderEmail;
  // const senderNo = req.body.no;
  try {
    const result = await queryService.deleteSender(senderEmail);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/deleteSender: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/InsertSearchlist", async (req, res) => {
  const { id: manualId, keyword, link, title, senderId, date } = req.body;

  try {
    const result = await queryService.InsertSearchlist(
      manualId,
      keyword,
      link,
      title,
      date,
      senderId,
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/InsertSearchlist: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/sendListClear", async (req, res) => {
  const senderId = req.body.senderId;
  try {
    const result = await queryService.sendListClear(senderId);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/SendListClear: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getHtmlTemplate", async (req, res) => {
  try {
    const { senderId } = req.body;
    const templateList = await queryService.getHtmlTemplate(senderId);
    // console.log("templateList_router: ", templateList);
    res.status(200).send(templateList);
  } catch (error) {
    logger.error("queryRouter.post(/htmlTemplate: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/setHtmlTemplate", async (req, res) => {
  const { templateName, contents, senderId, subject } = req.body;
  try {
    const result = await queryService.setHtmlTemplate(
      templateName,
      contents,
      senderId,
      subject,
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/setHtmlTemplate: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/checkHtmlTemplate", async (req, res) => {
  const { templateName, senderId } = req.body;
  try {
    const result = await queryService.checkHtmlTemplate(templateName, senderId);
    // console.log("result: ", result);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/checkHtmlTemplate: " + error.stack);
    res.sendStatus(500);
  }
});

queryRouter.post("/deleteHtmlTemplate", async (req, res) => {
  const { templateName, senderId } = req.body;
  try {
    const result = await queryService.deleteHtmlTemplate(
      templateName,
      senderId,
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/deleteHtmlTemplate: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/updateHtmlTemplate", async (req, res) => {
  const { templateName, contents, senderId, subject } = req.body;
  try {
    const result = await queryService.updateHtmlTemplate(
      templateName,
      contents,
      senderId,
      subject,
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/updateHtmlTemplate: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/mailDeliverySchedule", async (req, res) => {
  try {
    const result = await queryService.getDeliverySchedule();
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getDeliveryScheduleV2", async (req, res) => {
  const { groupName } = req.body;
  try {
    const result = await queryService.getDeliveryScheduleV2(groupName);
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/updateMailDeliverySchedule", async (req, res) => {
  try {
    const { no, newSendStartTime } = req.body;
    const result = await queryService.updateMailDeliverySchedule(
      no,
      newSendStartTime,
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("{routerName}.post(/{address}: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/dbMailingRegistration", async (req, res) => {
  const { transInfo } = req.body;
  // console.log(Object.keys(transInfo));
  try {
    const result = await queryService.dbMailingRegistration(transInfo);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(sendReservationEmail: " + error.stack);
    res.status(500).send(error);
  }
});

queryRouter.post("/addSentList", async (req, res) => {
  const { idList, senderId, senderEmail } = req.body;
  try {
    const result = await queryService.addSentList(
      idList,
      senderId,
      senderEmail,
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/addSentList: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/insertKeyWord", async (req, res) => {
  const { keyword, senderId } = req.body;
  const jsonStringKeyword = JSON.stringify([keyword]);
  try {
    const result = await queryService.insertKeyWord(
      jsonStringKeyword,
      senderId,
    );

    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/insertKeyWord: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getKeyWord", async (req, res) => {
  const { senderId } = req.body;
  try {
    const result = await queryService.getKeyWord(senderId);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/getKeyWord: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/deleteKeyWord", async (req, res) => {
  const { no } = req.body;
  try {
    const result = await queryService.deleteKeyWord(no);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/deleteKeyWord: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getAllowedTimeZone", async (req, res) => {
  try {
    const result = await queryService.getAllowedSendingTimeRange();
    res.status(200).json(result);
  } catch (error) {
    logger.error("queryRouter.post(/getAllowedTimeZone: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/deleteKeyWordList", (req, res) => {
  const { noList } = req.body;
  try {
    const result = queryService.deleteKeyWordList(noList);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/deleteKeyWordList: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getMailGroupState", async (req, res) => {
  try {
    const data = await queryService.getMailGroupState();
    // console.log("data: ", data);
    res.status(200).send({ isSuccess: true, data: data });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getMailGroupStateDetail", async (req, res) => {
  const { rowNo } = req.body;
  try {
    const result = await queryService.getMailGroupStateDetail(rowNo);
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/getSuperIds", async (req, res) => {
  try {
    const result = await queryService.getSuperIds();
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/changeSender", async (req, res) => {
  const { oldId, newId, domain } = req.body;
  console.log(
    "🔥 / file: dbRouter.js:361 / queryRouter.post / oldId, newId, domain:",
    oldId,
    newId,
    domain,
  );
  try {
    const result = await changeAccountName(oldId, newId, domain);
    if (result.success) {
      await queryService.updateSender(oldId, newId, domain);
      return res.status(200).send(result);
    } else {
      return res.status(200).send(result);
    }
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send(error);
  }
});

queryRouter.post("/getSenderAll", (req, res) => {
  try {
    const result = queryService.getSenderAll();
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

// delete group from ajax call /delete-group (given no)
queryRouter.post("/deleteGroup", async (req, res) => {
  const { no } = req.body;
  try {
    const result = await queryService.deleteGroup(no);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send(error);
  }
});

// suspendGroup from ajax call /suspendGroup (given no)
queryRouter.post("/suspendGroup", async (req, res) => {
  const { no } = req.body;
  try {
    const count = await queryService.getGroupDeliveryCount(no);
    if (count > 0) {
      const result = await queryService.suspendGroup(no);
      return res.status(200).send({ isSuccess: result });
    } else {
      return res
      .status(200)
      .send({ isSuccess: false, message: "이미 발송이 완료된 그룹입니다." });
    }
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send(error);
  }
});

// reopenGroup from ajax call /reopenGroup (given no)
queryRouter.post("/reopenGroup", async (req, res) => {
  const { groupNo } = req.body;
  try {
    const result = await queryService.reopenGroup(groupNo);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for getSenderTemplate()
queryRouter.post("/getSenderTemplateAll", async (req, res) => {
  try {
    const result = await queryService.getSenderTemplateAll();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for getSpecificTemplate(no)
queryRouter.post("/getSpecificTemplate", async (req, res) => {
  const { no } = req.body;
  try {
    const result = await queryService.getSpecificTemplate(no);
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/updateHtmlTemplateContents", async (req, res) => {
  const { no, templateName, mailTitle, innerHTML } = req.body;
  try {
    const result = await queryService.updateHtmlTemplateContents(
      no,
      templateName,
      mailTitle,
      innerHTML,
    );
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for deleteHtmlTemplateList(noList)
queryRouter.post("/deleteHtmlTemplateList", async (req, res) => {
  const { noList } = req.body;
  try {
    const result = await queryService.deleteHtmlTemplateList(noList);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/getSenderEmails", async (req, res) => {
  try {
    const result = await queryService.getSenderEmails();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for insert, delete sender email. instead of using updateSenderEmailAgent
queryRouter.post("/insertSenderEmailAgent", async (req, res) => {
  const { mail_no, agent_no } = req.body;
  try {
    const result = await queryService.insertSenderEmailAgent(mail_no, agent_no);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/disableSenderEmailAgent", async (req, res) => {
  const { mail_no, agent_no } = req.body;
  try {
    const result = await queryService.disableSenderEmailAgent(
      mail_no,
      agent_no,
    );
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for unassignAllEmails()
queryRouter.post("/unassignAllEmails", async (req, res) => {
  try {
    const result = await queryService.unassignAllEmails();
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/isEmailUsing", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await queryService.isEmailUsing(email);
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for getCurrentMailAllocationStatus()
queryRouter.post("/getCurrentMailAllocationStatus", async (req, res) => {
  try {
    const result = await queryService.getCurrentMailAllocationStatus();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/getErrorMessageSummary", async (req, res) => {
  const { groupNo } = req.body;
  try {
    const result = await queryService.getErrorMessageSummary(groupNo);
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for workingGroupState()
queryRouter.post("/getTodaySendedGroup", async (req, res) => {
  try {
    const result = await queryService.getTodaySendedGroup();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for workingGroupState()
queryRouter.post("/getWeekSendedGroup", async (req, res) => {
  try {
    console.log("week");
    const result = await queryService.getWeekSendedGroup();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/getAllSendedGroup", async (req, res) => {
  try {
    const result = await queryService.getAllSendedGroup();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/getAgentList", async (req, res) => {
  try {
    const result = await queryService.getAgentList();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/getStoreList", async (req, res) => {
  try {
    const result = await queryService.getStoreList();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/usersWhoHaveAlreadyJoined", async (req, res) => {
  const { date, agent_no, store_no } = req.body;

  try {
    const result = await queryService.usersWhoHaveAlreadyJoined(
      date,
      agent_no,
      store_no,
    );
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/updateMailContents", async (req, res) => {
  const { no, mailTitle, mailContent } = req.body;
  try {
    const result = await queryService.updateMailContents(
      no,
      mailTitle,
      mailContent,
    );
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for getFilterTemplateAll()
queryRouter.post("/getFilterTemplateAll", async (req, res) => {
  try {
    const result = await queryService.getFilterTemplateAll();
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

// route for saveFilterTemplate(filterName, filterArray)
queryRouter.post("/setFilterTemplate", async (req, res) => {
  const { filterName, filterArray } = req.body;
  try {
    const result = await queryService.setFilterTemplate(
      filterName,
      filterArray,
    );
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/deleteSpecificFilterList", async (req, res) => {
  const { noList } = req.body;
  try {
    const result = await queryService.deleteSpecificFilterList(noList);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/getThisGroupsSender", async (req, res) => {
  const { groupNo } = req.body;
  try {
    const result = await queryService.getThisGroupsSender(groupNo);
    res.status(200).send({ isSuccess: true, data: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/changeSenderEmail", async (req, res) => {
  const { groupNo, targetMail } = req.body;
  try {
    const result = await queryService.changeSenderEmail(groupNo, targetMail);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/changeServerName", async (req, res) => {
  const { no, newServerName } = req.body;
  try {
    const result = await queryService.changeServerName(no, newServerName);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/deleteServer", async (req, res) => {
  const { no } = req.body;

  try {
    const result = await queryService.deleteServer(no);
    res.status(200).send({ isSuccess: result });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.post("/storeHash", async (req, res) => {
  const { cno } = req.body;

  try {
    const { isSuccess, hash } = await queryService.storeHash(cno);
    res.status(200).send({ isSuccess, hash });
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send({ isSuccess: false, message: error.message });
  }
});

queryRouter.get('/super-account-list', async (req, res) => {
  try {
    const accounts = await queryService.getAllSuperAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

queryRouter.post('/super-account-add', async (req, res) => {
  try {
    const { superId } = req.body;
    const newAccount = await queryService.addSuperAccount(superId);
    res.json(newAccount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

queryRouter.delete('/super-account-delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await queryService.deleteSuperAccount(id);
    res.json({ isSuccess: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

queryRouter.put('/super-account-toggle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isEmergency } = req.body;
    await queryService.toggleEmergency(id, isEmergency);
    res.json({ isSuccess: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});