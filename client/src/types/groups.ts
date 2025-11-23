export interface Group {
  id: string;
  name: string;
  color: string;
  forProduct?: boolean;
  createdAt: string;
  updatedAt: string;
  items?: GroupItem[];
}
export interface GroupItem {
  id: string;
  name: string;
  priority: number;
  price: number;
  groupId: string;
  imgUrl?: string;
  createdAt: string;
  updatedAt: string;
}
