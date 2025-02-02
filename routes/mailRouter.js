import {
  addNewHiworksMail,
  deleteEmailFromHiworks,
} from "../models/hiworksService.js";

import express from "express";
import logger from "../config/logger.js";

// import { checkInformation } from "../models/mailService.js";



export const mailRouter = express.Router();

mailRouter.post("/testAll", async (req, res) => {
  const { email, testId, senderName } = req.body;

  try {
    const results = await checkInformation(email, testId, senderName);
    res.status(200).json(results);
  } catch (error) {
    logger.error(`mailRouter.post("/testAll": ` + error);
    res.status(500).send(error);
  }
});

mailRouter.post("/addNewHiworksMail", async (req, res) => {
  const { email, password, mySocketId } = req.body;

  try {
    const { isSuccess, message } = await addNewHiworksMail(
      email,
      password,
      mySocketId
    );
    res.status(200).send({ isSuccess, message });
  } catch (error) {
    logger.error(
      `mailRouter.post("/addNewHiworksMail": ` + JSON.stringify(error.message)
    );
    res
      .status(500)
      .send({ isSuccess: false, message: JSON.stringify(error.message) });
  }
});

mailRouter.delete(
  "/deleteEmailFromHiworks/:willRemoveEmail",
  async (req, res) => {
    const { willRemoveEmail } = req.params;

    try {
      const result = await deleteEmailFromHiworks(willRemoveEmail);
      res.status(200).send({ isSuccess: result });
    } catch (error) {
      logger.error(
        `mailRouter.delete("/deleteFromHiworks": ` +
          JSON.stringify(error.message)
      );
      res
        .status(500)
        .send({ isSuccess: false, message: JSON.stringify(error.message) });
    }
  }
);
