  export const utils = {
    rolesRevertString(address: string, role: string): string {
        return `AccessControl: account ${address.toLowerCase()} is missing role ${role.toLowerCase()}`
    }
  }

  export enum Token {
    MOM = 0,
    DAD = 1,
  }