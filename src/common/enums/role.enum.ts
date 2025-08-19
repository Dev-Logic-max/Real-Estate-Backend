export enum RoleEnum {
  Admin = 1,
  User = 2,
  Seller = 3,
  Buyer = 4,
  Agent = 5,
  Investor = 6,
}

// Map IDs to names for readability
export const RoleNames: Record<number, string> = {
  [RoleEnum.Admin]: 'admin',
  [RoleEnum.User]: 'user',
  [RoleEnum.Seller]: 'seller',
  [RoleEnum.Buyer]: 'buyer',
  [RoleEnum.Agent]: 'agent',
  [RoleEnum.Investor]: 'investor',
};