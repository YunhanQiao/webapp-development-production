export const CURRENCY_OPTIONS = {
  USD: "US Dollar",
  // EUR: "Euro",
  // JPY: "Japanese Yen",
  // GBP: "British Pound",
  // CAD: "Canadian Dollar",
  // NZD: "New Zealand Dollar",
  // AUD: "Australian Dollar",
};

export const TOURNAMENT_STEPS = {
  BASIC_INFO: "basicInfo",
  REG_PAYMENT: "regPaymentInfo",
  COLOR_THEME: "colorTheme",
  COURSES: "courses",
  // ROUNDS: "rounds",
  DIVISIONS: "divisions",
};

const ALL_TABS = Object.values(TOURNAMENT_STEPS);

// Linked list for calculating the previous/next step.
export const TOURNAMENT_STRUCTURE = ALL_TABS.reduce(
  (acc, key, idx) => ({
    ...acc,
    [key]: {
      prev: idx === 0 ? null : ALL_TABS[idx - 1],
      next: idx === ALL_TABS.length - 1 ? null : ALL_TABS[idx + 1],
    },
  }),
  {},
);

export const MAX_IMAGE_SIZE_IN_KB = 500;

// mock data till we have actual user data
export const MOCK_USER_OPTIONS = [
  {
    id: "66a86491c1a493ca3ca476ad",
    name: "John Doe",
  },
  {
    id: "2",
    name: "Jane Smith",
  },
  {
    id: "3",
    name: "Emily Johnson",
  },
  {
    id: "4",
    name: "Michael Brown",
  },
  {
    id: "5",
    name: "Sarah Davis",
  },
  {
    id: "6",
    name: "David Wilson",
  },
  {
    id: "7",
    name: "Linda Martinez",
  },
  {
    id: "8",
    name: "James Anderson",
  },
  {
    id: "9",
    name: "Patricia Thomas",
  },
  {
    id: "10",
    name: "Robert Taylor",
  },
];
