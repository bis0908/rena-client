import {
  checkUnsubscribe,
  getMemberId,
  realTimeIdCheck, updateJisuLog,
} from "../models/queryService.js";
import { crawlingId, idMisMatchCheck } from "../models/doSearchService.js";

import express from "express";
import logger from "../config/logger.js";

export const crawlingRouter = express.Router();

crawlingRouter.post("/search", async (req, res) => {
  let postingInfoArrObj, keywordStr;
  try {
    const { keyword, score1, score2, no: agent_no, mySocketId } = req.body;
    keywordStr = keyword;
    let newKeyword = keyword.replace(/ /g, "%20");
    const queryUrl = `https://m.search.naver.com/search.naver?ssc=tab.m_blog.all&sm=mtb_jum&query=${newKeyword}`;

    postingInfoArrObj = await crawlingId(
      queryUrl,
      parseFloat(score1),
      parseFloat(score2),
      keyword,
    );

    if (postingInfoArrObj.length === 0) {
      throw new Error("검색 결과 없음");
    }

    // logger.info("postingInfoArrObj: ", JSON.stringify(postingInfoArrObj));

    // const idList = idListAndScore.blog_id.map((idAndScore) => {
    //   return idAndScore.id;
    // });

    const domainIdArrObj = await idMisMatchCheck(postingInfoArrObj);

    const idList = domainIdArrObj.map((obj) => obj.id);

    const existIdLists = await realTimeIdCheck(idList, agent_no);
    // existIdLists: [{ id: '' }, { id: '' }, { id: '' }, ...]

    const UnsubscribeIdList = await checkUnsubscribe(idList);
    // UnsubscribeIdList: [{ id: '' }, { id: '' }, { id: '' }, ...]

    if (existIdLists.length > 0) {
      const existIdArr = existIdLists.map((ids) => {
        return ids.id;
      });
      domainIdArrObj.forEach((idAndScore) => {
        const target = idAndScore.id;
        if (existIdArr.includes(target)) {
          idAndScore.isSent = true;
        } else {
          idAndScore.isSent = false;
        }
      });
    } else {
      // If it hasn't been sent before
      domainIdArrObj.forEach((idAndScore) => {
        idAndScore.isSent = false;
      });
    }
    if (UnsubscribeIdList.length > 0) {
      const unSubIdArr = UnsubscribeIdList.map((ids) => {
        return ids.id;
      });
      domainIdArrObj.forEach((idAndScore) => {
        const target = idAndScore.id;
        if (unSubIdArr.includes(target)) {
          idAndScore.isUnsubscribe = true;
        } else {
          idAndScore.isUnsubscribe = false;
        }
      });
    } else {
      domainIdArrObj.forEach((idAndScore) => {
        idAndScore.isUnsubscribe = false;
      });
    }

    const members = await getMemberId(idList);

    const idListAndScoreAndMember = domainIdArrObj.map((idAndScore) => {
      const member = members.find((member) => member.blog_id === idAndScore.id);
      if (member) {
        return { ...idAndScore, member: `🦋 (${member.nickname})` };
      } else {
        return idAndScore;
      }
    });

    // filter idListAndScoreAndMember's each obj.scores by score1 and score2
    const filteredIdListAndScoreAndMember = idListAndScoreAndMember.filter(
      (idAndScore) => {
        return (
          idAndScore.score >= parseFloat(score1) &&
          idAndScore.score <= parseFloat(score2)
        );
      },
    );

    res.json({
      searchResults: filteredIdListAndScoreAndMember,
      // theme: idListAndScore.theme,
    });
  } catch (error) {
    logger.error("crawlingRouter.post('/search': " + error.stack);
    res.send(error);
  } finally {
    try {
      await updateJisuLog(postingInfoArrObj, keywordStr);
    } catch (updateError) {
      logger.error("Error updating jisu_log: " + updateError.stack);
      throw new Error("지수 DB 업데이트 중 오류 발생");
    }
  }
});

// module.exports = router; // error in ES module
