import * as authService from "../models/authService.js";

import { asyncHandler } from "../config/error_handler.js";
import express from "express";

export const authRouter = express.Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const result = await authService.serverLogin(password);

    req.session.loggedin = result;
    res.status(200).send({ success: result });
  })
);

authRouter.post(
  "/changePassword",
  asyncHandler(async (req, res) => {
    const { currentPw, newPw } = req.body;
    const result = await authService.changePassword(currentPw, newPw);
    res.status(200).send(result);
  })
);
