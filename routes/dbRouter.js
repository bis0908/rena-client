import * as queryService from "../models/queryService.js";

import { asyncHandler } from "../config/error_handler.js";
import { changeAccountName } from "../models/hiworksService.js";
import express from "express";
import { idMisMatchCheck } from "../models/doSearchService.js";

export const queryRouter = express.Router();

queryRouter.get(
  "/getSender",
  asyncHandler(async (req, res) => {
    const senderList = await queryService.getSender();
    res.send(senderList);
  })
);

queryRouter.get(
  "/getOneSender/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const senderName = await queryService.getOneSender(id);
    res.send(senderName);
  })
);

queryRouter.patch(
  "/changeSenderName",
  asyncHandler(async (req, res) => {
    const { name, no } = req.body;
    const result = await queryService.updateMailAgent(name, no);
    res.status(200).send({ isSuccess: result });
  })
);

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

queryRouter.get(
  "/getSenderEmail/:no",
  asyncHandler(async (req, res) => {
    const senderNo = req.params.no;
    const result = await queryService.getSenderEmail(senderNo);
    res.json(result);
  })
);

queryRouter.post(
  "/addSenderMail",
  asyncHandler(async (req, res) => {
    const { newId, newPw } = req.body;
    const result = await queryService.addSenderMail(newId, newPw);
    res.status(200).send(result);
  })
);

queryRouter.post(
  "/addBlackList",
  asyncHandler(async (req, res) => {
    const { id, date } = req.body;
    const result = await queryService.addBlackList(id, date);
    res.status(200).send(result);
  })
);

queryRouter.delete(
  "/deleteSender/:senderEmail",
  asyncHandler(async (req, res) => {
    const senderEmail = req.params.senderEmail;
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

queryRouter.delete(
  "/sendListClear/:senderId",
  asyncHandler(async (req, res) => {
    const senderId = req.params.senderId;
    const result = await queryService.sendListClear(senderId);
    res.status(200).send(result);
  })
);

queryRouter.get(
  "/getHtmlTemplate/:senderId",
  asyncHandler(async (req, res) => {
    const senderId = req.params.senderId;
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

queryRouter.delete(
  "/deleteHtmlTemplate/:templateName/:senderId",
  asyncHandler(async (req, res) => {
    const { templateName, senderId } = req.params;
    const result = await queryService.deleteHtmlTemplate(
      templateName,
      senderId
    );
    res.status(200).send(result);
  })
);

queryRouter.patch(
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

queryRouter.get(
  "/mailDeliverySchedule",
  asyncHandler(async (req, res) => {
    const result = await queryService.getDeliverySchedule();
    res.status(200).send(result);
  })
);

queryRouter.patch(
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

queryRouter.get(
  "/dbMailingRegistration",
  asyncHandler(async (req, res) => {
    const { transInfo } = req.body;
    const result = await queryService.dbMailingRegistration(transInfo);
    res.status(200).send(result);
  })
);

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

queryRouter.get(
  "/getKeyWord/:senderId",
  asyncHandler(async (req, res) => {
    const senderId = req.params.senderId;
    const result = await queryService.getKeyWord(senderId);
    res.status(200).send(result);
  })
);

queryRouter.delete(
  "/deleteKeyWord/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
    const result = await queryService.deleteKeyWord(no);
    res.status(200).send(result);
  })
);

queryRouter.get(
  "/getAllowedTimeZone",
  asyncHandler(async (req, res) => {
    const result = await queryService.getAllowedSendingTimeRange();
    res.status(200).json(result);
  })
);

queryRouter.delete(
  "/deleteKeyWordList/:noList",
  asyncHandler(async (req, res) => {
    const noList = req.params.noList;
    const result = await queryService.deleteKeyWordList(noList);
    res.status(200).send(result);
  })
);

queryRouter.get(
  "/getMailGroupState",
  asyncHandler(async (req, res) => {
    const data = await queryService.getMailGroupState();
    res.status(200).send({ isSuccess: true, data: data });
  })
);

queryRouter.get(
  "/getMailGroupStateDetail/:rowNo",
  asyncHandler(async (req, res) => {
    const rowNo = req.params.rowNo;
    const result = await queryService.getMailGroupStateDetail(rowNo);
    res.status(200).send(result);
  })
);

queryRouter.get(
  "/getSuperIds",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSuperIds();
    res.status(200).send(result);
  })
);

queryRouter.patch(
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

queryRouter.get(
  "/getSenderAll",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSenderAll();
    res.status(200).send(result);
  })
);

queryRouter.delete(
  "/deleteGroup/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
    const result = await queryService.deleteGroup(no);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.get(
  "/suspendGroup/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
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

queryRouter.patch(
  "/reopenGroup/:groupNo",
  asyncHandler(async (req, res) => {
    const groupNo = req.params.groupNo;
    const result = await queryService.reopenGroup(groupNo);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.get(
  "/getSenderTemplateAll",
  asyncHandler(async (req, res) => {
    const result = await queryService.getSenderTemplateAll();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.get(
  "/getSpecificTemplate/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
    const result = await queryService.getSpecificTemplate(no);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.patch(
  "/updateHtmlTemplateContents/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
    const { templateName, mailTitle, innerHTML } = req.body;
    const result = await queryService.updateHtmlTemplateContents(
      no,
      templateName,
      mailTitle,
      innerHTML
    );
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.delete(
  "/deleteHtmlTemplateList/:noList",
  asyncHandler(async (req, res) => {
    const noList = req.params.noList;
    const result = await queryService.deleteHtmlTemplateList(noList);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.get(
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

queryRouter.get(
  "/isEmailUsing/:email",
  asyncHandler(async (req, res) => {
    const email = req.params.email;
    const result = await queryService.isEmailUsing(email);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.get(
  "/getCurrentMailAllocationStatus",
  asyncHandler(async (req, res) => {
    const result = await queryService.getCurrentMailAllocationStatus();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.get(
  "/getErrorMessageSummary/:groupNo",
  asyncHandler(async (req, res) => {
    const groupNo = req.params.groupNo;
    const result = await queryService.getErrorMessageSummary(groupNo);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.get(
  "/getFilterTemplateAll",
  asyncHandler(async (req, res) => {
    const result = await queryService.getFilterTemplateAll();
    res.status(200).send({ isSuccess: true, data: result });
  })
);

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

queryRouter.delete(
  "/deleteSpecificFilterList/:noList",
  asyncHandler(async (req, res) => {
    const noList = req.params.noList;
    const result = await queryService.deleteSpecificFilterList(noList);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.get(
  "/getThisGroupsSender/:groupNo",
  asyncHandler(async (req, res) => {
    const groupNo = req.params.groupNo;
    const result = await queryService.getThisGroupsSender(groupNo);
    res.status(200).send({ isSuccess: true, data: result });
  })
);

queryRouter.patch(
  "/changeSenderEmail/:groupNo/:targetMail",
  asyncHandler(async (req, res) => {
    const groupNo = req.params.groupNo;
    const targetMail = req.params.targetMail;
    const result = await queryService.changeSenderEmail(groupNo, targetMail);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.patch(
  "/changeServerName/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
    const newServerName = req.body.newServerName;
    const result = await queryService.changeServerName(no, newServerName);
    res.status(200).send({ isSuccess: result });
  })
);

queryRouter.delete(
  "/deleteServer/:no",
  asyncHandler(async (req, res) => {
    const no = req.params.no;
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
    const id = req.params.id;
    await queryService.deleteSuperAccount(id);
    res.json({ isSuccess: true });
  })
);

queryRouter.patch(
  "/super-account-toggle/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { isEmergency } = req.body;
    await queryService.toggleEmergency(id, isEmergency);
    res.json({ isSuccess: true });
  })
);
