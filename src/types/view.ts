import { VIEWS } from "@/constants";

type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

export { ViewType };
export interface NavItem {
    view: string;
    label: string;
    adminOnly?: boolean;
}
