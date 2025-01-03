import * as queryService from "../models/queryService.js";

import { asyncHandler } from "../config/error_handler.js";
import { changeAccountName } from "../models/hiworksService.js";
import express from "express";
import { idMisMatchCheck } from "../models/doSearchService.js";

export const queryRouter = express.Router();

// 1. getSender 라우트
queryRouter.post(
  "/getSender",
  asyncHandler(async (req, res) => {
    const senderList = await queryService.getSender();
    res.send(senderList);
  })
);

// 2. getOneSender 라우트
queryRouter.post(
  "/getOneSender",
  asyncHandler(async (req, res) => {
    const { senderId } = req.body;
    const senderName = await queryService.getOneSender(senderId);
    res.send(senderName);
  })
);

// 3. changeSenderName 라우트
queryRouter.post(
  "/changeSenderName",
  asyncHandler(async (req, res) => {
    const { name, no } = req.body;
    const result = await queryService.updateMailAgent(name, no);
    res.status(200).send({ isSuccess: result });
  })
);

// 4. addManual 라우트
queryRouter.post(
  "/addManual",
  asyncHandler(async (req, res) => {
    const { no: senderNo, idList: listOfId, mySocketId } = req.body;
    let unSubscribe = [];

    const domainIdList = await idMisMatchCheck(listOfId, mySocketId);
    const idList = domainIdList.map((obj) => obj.id);
    const isSent = await queryService.realTimeIdCheck(idList, senderNo);

    if (isSent.length === 0) {
      unSubscribe = await queryService.checkUnsubscribe(idList);
    }

    if (unSubscribe.length == 0) {
      return res.status(200).send(domainIdList);
    } else {
      return res.status(200).send(unSubscribe);
    }
  })
);

// 5. getSenderEmail 라우트
queryRouter.post(
  "/getSenderEmail",
  asyncHandler(async (req, res) => {
    const senderNo = req.body.no;
    const result = await queryService.getSenderEmail(senderNo);
    res.json(result);
  })
);

// 6. addSenderMail 라우트
queryRouter.post(
  "/addSenderMail",
  asyncHandler(async (req, res) => {
    const { newId, newPw } = req.body;
    const result = await queryService.addSenderMail(newId, newPw);
    res.status(200).send(result);
  })
);

// 7. addBlackList 라우트
queryRouter.post(
  "/addBlackList",
  asyncHandler(async (req, res) => {
    const { id, date } = req.body;
    const result = await queryService.addBlackList(id, date);
    res.status(200).send(result);
  })
);

// 8. deleteSender 라우트
queryRouter.post(
  "/deleteSender",
  asyncHandler(async (req, res) => {
    const senderEmail = req.body.senderEmail;
    const result = await queryService.deleteSender(senderEmail);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/InsertSearchlist",
  asyncHandler(async (req, res) => {
    const { id: manualId, keyword, link, title, senderId, date } = req.body;
    const result = await queryService.InsertSearchlist(
      manualId,
      keyword,
      link,
      title,
      date,
      senderId
    );
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/sendListClear",
  asyncHandler(async (req, res) => {
    const senderId = req.body.senderId;
    const result = await queryService.sendListClear(senderId);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/getHtmlTemplate",
  asyncHandler(async (req, res) => {
    const { senderId } = req.body;
    const templateList = await queryService.getHtmlTemplate(senderId);
    res.status(200).send(templateList);
  })
);

queryRouter.post(
  "/setHtmlTemplate",
  asyncHandler(async (req, res) => {
    const { templateName, contents, senderId, subject } = req.body;
    const result = await queryService.setHtmlTemplate(
      templateName,
      contents,
      senderId,
      subject
    );
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/checkHtmlTemplate",
  asyncHandler(async (req, res) => {
    const { templateName, senderId } = req.body;
    const result = await queryService.checkHtmlTemplate(templateName, senderId);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/deleteHtmlTemplate",
  asyncHandler(async (req, res) => {
    const { templateName, senderId } = req.body;
    const result = await queryService.deleteHtmlTemplate(
      templateName,
      senderId
    );
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/updateHtmlTemplate",
  asyncHandler(async (req, res) => {
    const { templateName, contents, senderId, subject } = req.body;
    const result = await queryService.updateHtmlTemplate(
      templateName,
      contents,
      senderId,
      subject
    );
    res.status(200).send(result);
  })
);

// 9. getDeliverySchedule 라우트
queryRouter.post(
  "/mailDeliverySchedule",
  asyncHandler(async (req, res) => {
    const result = await queryService.getDeliverySchedule();
    res.status(200).send(result);
  })
);

// 10. updateMailDeliverySchedule 라우트
queryRouter.post(
  "/updateMailDeliverySchedule",
  asyncHandler(async (req, res) => {
    const { no, newSendStartTime } = req.body;
    const result = await queryService.updateMailDeliverySchedule(
      no,
      newSendStartTime
    );
    res.status(200).send(result);
  })
);

// 11. dbMailingRegistration 라우트
queryRouter.post(
  "/dbMailingRegistration",
  asyncHandler(async (req, res) => {
    const { transInfo } = req.body;
    const result = await queryService.dbMailingRegistration(transInfo);
    res.status(200).send(result);
  })
);

// 12. addSentList 라우트
queryRouter.post(
  "/addSentList",
  asyncHandler(async (req, res) => {
    const { idList, senderId, senderEmail } = req.body;
    const result = await queryService.addSentList(
      idList,
      senderId,
      senderEmail
    );
    res.status(200).send(result);
  })
);

// 13. insertKeyWord 라우트
queryRouter.post(
  "/insertKeyWord",
  asyncHandler(async (req, res) => {
    const { keyword, senderId } = req.body;
    const jsonStringKeyword = JSON.stringify([keyword]);
    const result = await queryService.insertKeyWord(
      jsonStringKeyword,
      senderId
    );
    res.status(200).send(result);
  })
);

// 14. getKeyWord 라우트
queryRouter.post(
  "/getKeyWord",
  asyncHandler(async (req, res) => {
    const { senderId } = req.body;
    const result = await queryService.getKeyWord(senderId);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/deleteKeyWord",
  asyncHandler(async (req, res) => {
    const { no } = req.body;
    const result = await queryService.deleteKeyWord(no);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/getAllowedTimeZone",
  asyncHandler(async (req, res) => {
    const result = await queryService.getAllowedSendingTimeRange();
    res.status(200).json(result);
  })
);

queryRouter.post(
  "/deleteKeyWordList",
  asyncHandler(async (req, res) => {
    const { noList } = req.body;
    const result = await queryService.deleteKeyWordList(noList);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/getMailGroupState",
  asyncHandler(async (req, res) => {
    const data = await queryService.getMailGroupState();
    res.status(200).send({ isSuccess: true, data: data });
  })
);

queryRouter.post(
  "/getMailGroupStateDetail",
  asyncHandler(async (req, res) => {
    const { rowNo } = req.body;
    const result = await queryService.getMailGroupStateDetail(rowNo);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/getSuperIds",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSuperIds();
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/changeSender",
  asyncHandler(async (req, res) => {
    const { oldId, newId, domain } = req.body;
    const result = await changeAccountName(oldId, newId, domain);

    if (result.success) {
      await queryService.updateSender(oldId, newId, domain);
      return res.status(200).send(result);
    } else {
      return res.status(200).send(result);
    }
  })
);

queryRouter.post(
  "/getSenderAll",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSenderAll();
    res.status(200).send(result);
  })
);

// delete group from ajax call /delete-group (given no)
queryRouter.post(
  "/deleteGroup",
  asyncHandler(async (req, res) => {
    const { no } = req.body;
    const result = await queryService.deleteGroup(no);
    res.status(200).send({ isSuccess: result });
  })
);

// suspendGroup from ajax call /suspendGroup (given no)
queryRouter.post(
  "/suspendGroup",
  asyncHandler(async (req, res) => {
    const { no } = req.body;
    const count = await queryService.getGroupDeliveryCount(no);

    if (count > 0) {
      const result = await queryService.suspendGroup(no);
      return res.status(200).send({ isSuccess: result });
    } else {
      return res.status(200).send({
        isSuccess: false,
        message: "이미 발송이 완료된 그룹입니다.",
      });
    }
  })
);

// reopenGroup from ajax call /reopenGroup (given no)
queryRouter.post(
  "/reopenGroup",
  asyncHandler(async (req, res) => {
    const { groupNo } = req.body;
    const result = await queryService.reopenGroup(groupNo);
    res.status(200).send({ isSuccess: result });
  })
);

// route for getSenderTemplate()
queryRouter.post(
  "/getSenderTemplateAll",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSenderTemplateAll();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

// route for getSpecificTemplate(no)
queryRouter.post(
  "/getSpecificTemplate",
  asyncHandler(async (req, res) => {
    const { no } = req.body;
    const result = await queryService.getSpecificTemplate(no);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.post(
  "/updateHtmlTemplateContents",
  asyncHandler(async (req, res) => {
    const { no, templateName, mailTitle, innerHTML } = req.body;
    const result = await queryService.updateHtmlTemplateContents(
      no,
      templateName,
      mailTitle,
      innerHTML
    );
    res.status(200).send({ isSuccess: result });
  })
);

// route for deleteHtmlTemplateList(noList)
queryRouter.post(
  "/deleteHtmlTemplateList",
  asyncHandler(async (req, res) => {
    const { noList } = req.body;
    const result = await queryService.deleteHtmlTemplateList(noList);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/getSenderEmails",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSenderEmails();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.post(
  "/insertSenderEmailAgent",
  asyncHandler(async (req, res) => {
    const { mail_no, agent_no } = req.body;
    const result = await queryService.insertSenderEmailAgent(mail_no, agent_no);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/disableSenderEmailAgent",
  asyncHandler(async (req, res) => {
    const { mail_no, agent_no } = req.body;
    const result = await queryService.disableSenderEmailAgent(
      mail_no,
      agent_no
    );
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/unassignAllEmails",
  asyncHandler(async (req, res) => {
    const result = await queryService.unassignAllEmails();
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/isEmailUsing",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await queryService.isEmailUsing(email);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.post(
  "/getCurrentMailAllocationStatus",
  asyncHandler(async (req, res) => {
    const result = await queryService.getCurrentMailAllocationStatus();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.post(
  "/getErrorMessageSummary",
  asyncHandler(async (req, res) => {
    const { groupNo } = req.body;
    const result = await queryService.getErrorMessageSummary(groupNo);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

// route for getFilterTemplateAll()
queryRouter.post(
  "/getFilterTemplateAll",
  asyncHandler(async (req, res) => {
    const result = await queryService.getFilterTemplateAll();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

// route for saveFilterTemplate(filterName, filterArray)
queryRouter.post(
  "/setFilterTemplate",
  asyncHandler(async (req, res) => {
    const { filterName, filterArray } = req.body;
    const result = await queryService.setFilterTemplate(
      filterName,
      filterArray
    );
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/deleteSpecificFilterList",
  asyncHandler(async (req, res) => {
    const { noList } = req.body;
    const result = await queryService.deleteSpecificFilterList(noList);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/getThisGroupsSender",
  asyncHandler(async (req, res) => {
    const { groupNo } = req.body;
    const result = await queryService.getThisGroupsSender(groupNo);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.post(
  "/changeSenderEmail",
  asyncHandler(async (req, res) => {
    const { groupNo, targetMail } = req.body;
    const result = await queryService.changeSenderEmail(groupNo, targetMail);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/changeServerName",
  asyncHandler(async (req, res) => {
    const { no, newServerName } = req.body;
    const result = await queryService.changeServerName(no, newServerName);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/deleteServer",
  asyncHandler(async (req, res) => {
    const { no } = req.body;
    const result = await queryService.deleteServer(no);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.post(
  "/storeHash",
  asyncHandler(async (req, res) => {
    const { cno } = req.body;
    const { isSuccess, hash } = await queryService.storeHash(cno);
    res.status(200).send({ isSuccess, hash });
  })
);

queryRouter.get(
  "/super-account-list",
  asyncHandler(async (req, res) => {
    const accounts = await queryService.getAllSuperAccounts();
    res.json(accounts);
  })
);

queryRouter.post(
  "/super-account-add",
  asyncHandler(async (req, res) => {
    const { superId } = req.body;
    const newAccount = await queryService.addSuperAccount(superId);
    res.json(newAccount);
  })
);

queryRouter.delete(
  "/super-account-delete/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await queryService.deleteSuperAccount(id);
    res.json({ isSuccess: true });
  })
);

queryRouter.put(
  "/super-account-toggle/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isEmergency } = req.body;
    await queryService.toggleEmergency(id, isEmergency);
    res.json({ isSuccess: true });
  })
);
