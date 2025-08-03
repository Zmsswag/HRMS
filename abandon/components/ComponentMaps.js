// ComponentMaps.js - 存放组件映射，解决Fast Refresh警告
import { InputComponent, SelectComponent, DatePickerComponent, UploadComponent } from './FormComponents';
import { ApprovalNode, NotificationNode, ConditionNode, AssignmentNode } from './WorkflowComponents';

export const componentMap = {
  input: InputComponent,
  select: SelectComponent,
  datepicker: DatePickerComponent,
  upload: UploadComponent
};

export const workflowComponentMap = {
  approval: ApprovalNode,
  notification: NotificationNode,
  condition: ConditionNode,
  assignment: AssignmentNode
};