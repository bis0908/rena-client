import {
  checkUnsubscribe,
  getMemberId,
  realTimeIdCheck,
  updateJisuLog,
} from "../models/queryService.js";
import { crawlingId, idMisMatchCheck } from "../models/doSearchService.js";

import express from "express";
import logger from "../config/logger.js";

export const crawlingRouter = express.Router();

// 검색 결과 처리 함수
async function processSearchResults(postingInfoArrObj, agent_no) {
  const domainIdArrObj = await idMisMatchCheck(postingInfoArrObj);
  const idList = domainIdArrObj.map((obj) => obj.id);

  const [existIdLists, UnsubscribeIdList, members] = await Promise.all([
    realTimeIdCheck(idList, agent_no),
    checkUnsubscribe(idList),
    getMemberId(idList),
  ]);

  return { domainIdArrObj, existIdLists, UnsubscribeIdList, members, idList };
}

// 검색 결과에 발송 상태 추가
function addSendStatus(domainIdArrObj, existIdLists) {
  const existIdArr = existIdLists.map((ids) => ids.id);

  domainIdArrObj.forEach((idAndScore) => {
    idAndScore.isSent = existIdArr.includes(idAndScore.id);
  });
}

// 검색 결과에 구독 취소 상태 추가
function addUnsubscribeStatus(domainIdArrObj, UnsubscribeIdList) {
  const unSubIdArr = UnsubscribeIdList.map((ids) => ids.id);

  domainIdArrObj.forEach((idAndScore) => {
    idAndScore.isUnsubscribe = unSubIdArr.includes(idAndScore.id);
  });
}

// 검색 결과에 회원 정보 추가
function addMemberInfo(domainIdArrObj, members) {
  return domainIdArrObj.map((idAndScore) => {
    const member = members.find((member) => member.blog_id === idAndScore.id);
    return member
      ? { ...idAndScore, member: `🦋 (${member.nickname})` }
      : idAndScore;
  });
}

crawlingRouter.post("/search", async (req, res) => {
  let postingInfoArrObj, keywordStr;
  try {
    const { keyword, score1, score2, no: agent_no } = req.body;
    keywordStr = keyword;
    const newKeyword = keyword.replace(/ /g, "%20");
    const queryUrl = `https://m.search.naver.com/search.naver?ssc=tab.m_blog.all&sm=mtb_jum&query=${newKeyword}`;

    postingInfoArrObj = await crawlingId(
      queryUrl,
      parseFloat(score1),
      parseFloat(score2),
      keyword
    );
    if (postingInfoArrObj.length === 0) {
      throw new Error("검색 결과 없음");
    }

    const { domainIdArrObj, existIdLists, UnsubscribeIdList, members } =
      await processSearchResults(postingInfoArrObj, agent_no);

    addSendStatus(domainIdArrObj, existIdLists);
    addUnsubscribeStatus(domainIdArrObj, UnsubscribeIdList);

    const idListAndScoreAndMember = addMemberInfo(domainIdArrObj, members);
    const filteredResults = idListAndScoreAndMember.filter(
      (idAndScore) =>
        idAndScore.score >= parseFloat(score1) &&
        idAndScore.score <= parseFloat(score2)
    );

    res.json({ searchResults: filteredResults });
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
