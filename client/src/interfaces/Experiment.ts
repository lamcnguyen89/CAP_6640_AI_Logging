import IConditionGroup from "./Condition";
export interface IExperiment {
  _id: string;
  name: string;
  description: string;
  irbProtocolNumber: string;
  irbEmailAddress: string;
  createdBy: string;
  collaborators: Array<string>;
  participants: Array<string>;
  conditions: Array<IConditionGroup>;
  isMultiSite: boolean;
  sites: Array<any>;
  status: null | undefined | "creator" | "collaborator";
  draft: boolean;
  hasFiles: boolean;
  key: string;
}
