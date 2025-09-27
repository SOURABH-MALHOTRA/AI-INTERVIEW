import storage from 'redux-persist/lib/storage';

export const persistConfig = {
  key: 'ai-interview-assistant',
  storage,
  whitelist: ['interview', 'candidate'],
  blacklist: [],
  version: 1,
  migrate: (state) => {
    // Handle migration if needed in future versions
    return Promise.resolve(state);
  },
  debug: process.env.NODE_ENV === 'development',
  serialize: true,
  deserialize: true,
  timeout: 10000,
  writeFailHandler: (err) => {
    console.error('Redux persist write failed:', err);
  },
  transforms: [],
  stateReconciler: undefined, // Use default auto merge level 2
};

export const interviewPersistConfig = {
  key: 'interview',
  storage,
  whitelist: ['currentInterview', 'isInterviewActive'],
  blacklist: ['isLoading', 'error', 'timer'],
};

export const candidatePersistConfig = {
  key: 'candidate',
  storage,
  whitelist: ['candidates'],
  blacklist: ['selectedCandidate'],
};

export default persistConfig;