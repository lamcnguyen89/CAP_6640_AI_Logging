interface ICondition {
  name: string;
  value: string;
}

export default interface IConditionGroup {
  groupName: string;
  conditions: ICondition[];
}
