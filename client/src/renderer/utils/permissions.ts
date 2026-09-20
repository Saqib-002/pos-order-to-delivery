export const hasModuleAccess = (
  view: string,
  userModulePermissions: string[] | undefined,
  userRole: string | undefined,
  viewRoles?: string[]
): boolean => {
  if (userModulePermissions && userModulePermissions.length > 0) {
    if (userModulePermissions.includes(view)) {
      return true;
    }
    // For web-admin, grant access if user has any web-admin:* sub-module permission
    if (view === "web-admin" && userModulePermissions.some((p) => p.startsWith("web-admin:"))) {
      return true;
    }
    return false;
  }

  if (viewRoles && userRole) {
    return viewRoles.includes(userRole.toLowerCase());
  }

  return false;
};

export const hasWebAdminTabAccess = (
  tabKey: string,
  userModulePermissions: string[] | undefined,
  userRole: string | undefined
): boolean => {
  if (userRole && userRole.toLowerCase() === "admin") {
    return true;
  }

  if (!userModulePermissions || userModulePermissions.length === 0) {
    return false;
  }

  // Check specific sub-module permission
  if (userModulePermissions.includes(`web-admin:${tabKey}`)) {
    return true;
  }

  // If user has general "web-admin" module permission and NO specific sub-permissions specified
  const hasSpecificSubPermissions = userModulePermissions.some((p) =>
    p.startsWith("web-admin:")
  );
  if (userModulePermissions.includes("web-admin") && !hasSpecificSubPermissions) {
    return true;
  }

  return false;
};
