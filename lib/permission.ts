import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  studentRecord: ["view", "update", "create"],
  institutionalRecord: ["view", "update", "delete", "create"],
  datasetImport: ["view", "create"],
  deduplication: ["run", "review", "merge"],
} as const;

export const ac = createAccessControl(statement);

export const student = ac.newRole({
  studentRecord: ["view", "create", "update"],
});

export const registry_staff = ac.newRole({
  studentRecord: ["view", "create", "update"],
  institutionalRecord: ["view", "update", "create"],
  datasetImport: ["view", "create"],
  deduplication: ["run", "review", "merge"],
});

export const admin = ac.newRole({
  studentRecord: ["view", "update", "create"],
  institutionalRecord: ["view", "update", "delete", "create"],
  datasetImport: ["view", "create"],
  deduplication: ["run", "review", "merge"],
  ...adminAc.statements,
});

