import { VIEWS } from "@/constants";

type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

export { ViewType };