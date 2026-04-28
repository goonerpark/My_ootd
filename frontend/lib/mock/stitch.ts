export type MockLook = {
  id: string;
  title: string;
  imageUrl: string;
  badge?: string;
};

const PLACEHOLDER = '/mock/base.svg';

export const mockDashboardLook: MockLook = {
  id: 'today-look',
  title: "Today's Curated Look",
  imageUrl: PLACEHOLDER,
  badge: 'Daily Pick'
};

export const mockStyleJournal: MockLook[] = [
  { id: '1', title: 'Summer Essentials', imageUrl: PLACEHOLDER },
  { id: '2', title: 'Detail Shot', imageUrl: PLACEHOLDER },
  { id: '3', title: 'Seasonal Mood', imageUrl: PLACEHOLDER },
  { id: '4', title: 'Evening Inspo', imageUrl: PLACEHOLDER }
];

export const mockOutfitCards: MockLook[] = [
  { id: 'o1', title: 'Urban Explorer', imageUrl: PLACEHOLDER },
  { id: 'o2', title: 'Monochrome Monday', imageUrl: PLACEHOLDER },
  { id: 'o3', title: 'Weekend Relaxed', imageUrl: PLACEHOLDER }
];
