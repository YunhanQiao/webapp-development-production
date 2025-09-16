export const userSelector = state => state.user;

export const userPreferencesSelector = state => state.user.user.preferences;

export const isUserLoadingSelector = state => state.user.isLoading;

export const isUserAuthenticated = state => state.user.authenticated;
