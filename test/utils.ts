  export const utils = {
    rolesRevertString(address: string, role: string): string {
        return `AccessControl: account ${address.toLowerCase()} is missing role ${role.toLowerCase()}`
    }
  }