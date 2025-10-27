export const hasModuleAccess = (
  view: string,
  userModulePermissions: string[] | undefined,
  userRole: string | undefined,
  viewRoles?: string[]
): boolean => {
  if (userModulePermissions && userModulePermissions.length > 0) {
    return userModulePermissions.includes(view);
  }

  if (viewRoles && userRole) {
    return viewRoles.includes(userRole.toLowerCase());
  }

  return false;
};
