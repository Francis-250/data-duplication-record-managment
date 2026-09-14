import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  patientProfile: ["view", "update", "delete", "create"],
} as const;

export const ac = createAccessControl(statement);

export const patient = ac.newRole({
  patientProfile: ["view", "update"],
});

export const doctor = ac.newRole({
  patientProfile: ["view"],
});

export const admin = ac.newRole({
  patientProfile: ["view", "update", "delete", "create"],
  ...adminAc.statements,
});
