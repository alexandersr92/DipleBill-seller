import React, { Dispatch, SetStateAction, HTMLAttributeAnchorTarget } from 'react';

/* Context Types */
export type LayoutState = {
  overlayMenuActive: boolean;
  sidebarVisible: boolean;
};

export interface LayoutContextProps {
  layoutState: LayoutState;
  setLayoutState: Dispatch<SetStateAction<LayoutState>>;
  onMenuToggle: () => void;
}

/* Menu Types */

type CommandProps = {
  originalEvent: React.MouseEvent<HTMLAnchorElement, MouseEvent>;
  item: MenuModelItem;
};

export interface MenuContextProps {
  activeMenu: string;
  setActiveMenu: Dispatch<SetStateAction<string>>;
}

export interface MenuProps {
  model: MenuModel[];
}

export interface MenuModel {
  label: string;
  icon?: string;
  items?: MenuModel[];
  to?: string;
  url?: string;
  target?: HTMLAttributeAnchorTarget;
  seperator?: boolean;
}

export interface MenuItemType extends MenuModel {
  items?: MenuItemType[];
  badge?: 'UPDATED' | 'NEW';
  badgeClass?: string;
  class?: string;
  preventExact?: boolean;
  visible?: boolean;
  disabled?: boolean;
  replaceUrl?: boolean;
  command?: ({ originalEvent, item }: CommandProps) => void;
}

export interface MenuItemProps {
  item?: MenuItemType;
  parentKey?: string;
  index?: number;
  root?: boolean;
  className?: string;
}

export interface IMenuItem {
  label: string;
  items?: IMenuItem[];
  icon?: string;
  to?: string;
  url?: string;
  target?: HTMLAttributeAnchorTarget;
}

export interface IMenuItemProps extends IMenuItem {
  item: IMenuItem;
  index: number;
  className?: string;
}
