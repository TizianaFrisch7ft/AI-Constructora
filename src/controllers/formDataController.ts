// src/controllers/formDataController.ts
import Project from "../models/Project";
import PM from "../models/PM";
import { Request, Response } from "express";

export const getProjects = async (_req: Request, res: Response) => {
  const projects = await Project.find().select("id name").lean();
  return res.json(projects);
};

export const getPMs = async (_req: Request, res: Response) => {
  const pms = await PM.find().select("id name surname").lean();
  return res.json(pms.map(pm => ({ ...pm, fullName: `${pm.name} ${pm.surname}` })));
};
