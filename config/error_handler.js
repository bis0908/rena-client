import logger from "./logger.js";

// 공통 에러 처리 미들웨어
export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    isSuccess: false,
    message: message,
  });
};

// 비동기 에러 처리를 위한 래퍼 함수
export const asyncHandler = (fn) => (req, res, next) => {
  // 발생한 오류를 글로벌 에러 핸들러로 전달
  Promise.resolve(fn(req, res, next)).catch(next);
};
