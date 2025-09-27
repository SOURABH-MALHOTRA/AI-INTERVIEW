import { createSlice, createSelector } from '@reduxjs/toolkit';
import { INTERVIEW_STATUS } from '../../utils/constants';

const candidateSlice = createSlice({
  name: 'candidate',
  initialState: {
    candidates: [],
    searchQuery: '',
    sortBy: 'completedAt', // 'score', 'name', 'completedAt', 'duration'
    sortOrder: 'desc', // 'asc', 'desc'
    selectedCandidate: null,
    filterBy: 'all', // 'all', 'completed', 'in_progress', 'highly_recommended', 'recommended', 'not_recommended'
    stats: {
      total: 0,
      completed: 0,
      inProgress: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0
    },
    isLoading: false,
    error: null
  },
  reducers: {
    addCandidate: (state, action) => {
      const interview = action.payload;
      
      // Validate interview data
      if (!interview.id || !interview.candidateInfo) {
        console.error('Invalid interview data:', interview);
        return;
      }

      const existingIndex = state.candidates.findIndex(c => c.id === interview.id);
      
      if (existingIndex >= 0) {
        // Update existing candidate
        state.candidates[existingIndex] = {
          ...state.candidates[existingIndex],
          ...interview,
          updatedAt: new Date().toISOString()
        };
        console.log('Updated candidate:', interview.candidateInfo.name);
      } else {
        // Add new candidate
        const candidateData = {
          ...interview,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        state.candidates.push(candidateData);
        console.log('Added new candidate:', interview.candidateInfo.name);
      }

      // Recalculate stats
      candidateSlice.caseReducers.calculateStats(state);
    },

    updateCandidateInterview: (state, action) => {
      const { candidateId, updates } = action.payload;
      const candidateIndex = state.candidates.findIndex(c => c.id === candidateId);
      
      if (candidateIndex >= 0) {
        state.candidates[candidateIndex] = {
          ...state.candidates[candidateIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        // If this is the selected candidate, update it too
        if (state.selectedCandidate?.id === candidateId) {
          state.selectedCandidate = state.candidates[candidateIndex];
        }
        
        // Recalculate stats
        candidateSlice.caseReducers.calculateStats(state);
      }
    },

    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload.toLowerCase().trim();
    },

    setSortBy: (state, action) => {
      const newSortBy = action.payload;
      
      // If same sort field clicked, toggle order
      if (state.sortBy === newSortBy) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = newSortBy;
        // Set default order based on field type
        state.sortOrder = ['name'].includes(newSortBy) ? 'asc' : 'desc';
      }
    },

    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },

    setFilterBy: (state, action) => {
      state.filterBy = action.payload;
    },

    setSelectedCandidate: (state, action) => {
      const candidateId = action.payload;
      
      if (candidateId) {
        state.selectedCandidate = state.candidates.find(c => c.id === candidateId) || null;
        console.log('Selected candidate:', state.selectedCandidate?.candidateInfo?.name);
      } else {
        state.selectedCandidate = null;
      }
    },

    removeCandidate: (state, action) => {
      const candidateId = action.payload;
      const candidateToRemove = state.candidates.find(c => c.id === candidateId);
      
      state.candidates = state.candidates.filter(c => c.id !== candidateId);
      
      if (state.selectedCandidate?.id === candidateId) {
        state.selectedCandidate = null;
      }
      
      console.log('Removed candidate:', candidateToRemove?.candidateInfo?.name);
      
      // Recalculate stats
      candidateSlice.caseReducers.calculateStats(state);
    },

    bulkRemoveCandidates: (state, action) => {
      const candidateIds = action.payload;
      const removedCount = candidateIds.length;
      
      state.candidates = state.candidates.filter(c => !candidateIds.includes(c.id));
      
      if (state.selectedCandidate && candidateIds.includes(state.selectedCandidate.id)) {
        state.selectedCandidate = null;
      }
      
      console.log(`Removed ${removedCount} candidates`);
      
      // Recalculate stats
      candidateSlice.caseReducers.calculateStats(state);
    },

    clearAllCandidates: (state) => {
      const totalCount = state.candidates.length;
      state.candidates = [];
      state.selectedCandidate = null;
      state.stats = {
        total: 0,
        completed: 0,
        inProgress: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0
      };
      
      console.log(`Cleared all ${totalCount} candidates`);
    },

    calculateStats: (state) => {
      const completedCandidates = state.candidates.filter(c => c.status === INTERVIEW_STATUS.COMPLETED);
      const inProgressCandidates = state.candidates.filter(c => c.status === INTERVIEW_STATUS.IN_PROGRESS);
      
      const scores = completedCandidates
        .filter(c => typeof c.totalScore === 'number')
        .map(c => c.totalScore);

      state.stats = {
        total: state.candidates.length,
        completed: completedCandidates.length,
        inProgress: inProgressCandidates.length,
        averageScore: scores.length > 0 ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : 0,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0
      };
    },

    // Utility actions
    markCandidateAsViewed: (state, action) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate) {
        candidate.viewedAt = new Date().toISOString();
        candidate.isNew = false;
      }
    },

    addCandidateNote: (state, action) => {
      const { candidateId, note, author = 'System' } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate) {
        if (!candidate.notes) {
          candidate.notes = [];
        }
        
        candidate.notes.push({
          id: Date.now().toString(),
          text: note,
          author,
          createdAt: new Date().toISOString()
        });
        
        candidate.updatedAt = new Date().toISOString();
      }
    },

    updateCandidateRating: (state, action) => {
      const { candidateId, rating, reviewer = 'System' } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate && rating >= 1 && rating <= 5) {
        candidate.rating = rating;
        candidate.ratedBy = reviewer;
        candidate.ratedAt = new Date().toISOString();
        candidate.updatedAt = new Date().toISOString();
      }
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Import/Export functionality
    importCandidates: (state, action) => {
      const importedCandidates = action.payload;
      const validCandidates = importedCandidates.filter(c => c.id && c.candidateInfo);
      
      validCandidates.forEach(candidate => {
        const existingIndex = state.candidates.findIndex(c => c.id === candidate.id);
        
        if (existingIndex >= 0) {
          state.candidates[existingIndex] = {
            ...candidate,
            importedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          state.candidates.push({
            ...candidate,
            importedAt: new Date().toISOString(),
            addedAt: candidate.addedAt || new Date().toISOString()
          });
        }
      });
      
      console.log(`Imported ${validCandidates.length} candidates`);
      
      // Recalculate stats
      candidateSlice.caseReducers.calculateStats(state);
    }
  }
});

// Selectors for better performance and reusability
export const selectAllCandidates = (state) => state.candidate.candidates;

export const selectFilteredAndSortedCandidates = createSelector(
  [selectAllCandidates, (state) => state.candidate.searchQuery, (state) => state.candidate.filterBy, (state) => state.candidate.sortBy, (state) => state.candidate.sortOrder],
  (candidates, searchQuery, filterBy, sortBy, sortOrder) => {
    let filtered = [...candidates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(candidate => {
        const name = candidate.candidateInfo?.name?.toLowerCase() || '';
        const email = candidate.candidateInfo?.email?.toLowerCase() || '';
        const phone = candidate.candidateInfo?.phone || '';
        
        return name.includes(searchQuery) || 
               email.includes(searchQuery) || 
               phone.includes(searchQuery);
      });
    }

    // Apply status filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'completed':
          filtered = filtered.filter(c => c.status === INTERVIEW_STATUS.COMPLETED);
          break;
        case 'in_progress':
          filtered = filtered.filter(c => c.status === INTERVIEW_STATUS.IN_PROGRESS);
          break;
        case 'highly_recommended':
          filtered = filtered.filter(c => c.totalScore >= 10); // 80%+ score
          break;
        case 'recommended':
          filtered = filtered.filter(c => c.totalScore >= 7 && c.totalScore < 10); // 60-80%
          break;
        case 'not_recommended':
          filtered = filtered.filter(c => c.totalScore < 7); // <60%
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.candidateInfo?.name?.toLowerCase() || '';
          bValue = b.candidateInfo?.name?.toLowerCase() || '';
          break;
        case 'score':
          aValue = a.totalScore || 0;
          bValue = b.totalScore || 0;
          break;
        case 'completedAt':
          aValue = new Date(a.completedAt || a.addedAt || 0);
          bValue = new Date(b.completedAt || b.addedAt || 0);
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        default:
          aValue = a.addedAt || '';
          bValue = b.addedAt || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }
);

export const selectCandidateStats = (state) => state.candidate.stats;

export const selectSelectedCandidate = (state) => state.candidate.selectedCandidate;

export const selectCandidateById = (candidateId) => (state) =>
  state.candidate.candidates.find(c => c.id === candidateId);

// Helper selector for recommendation categories
export const selectCandidatesByRecommendation = createSelector(
  [selectAllCandidates],
  (candidates) => {
    const completed = candidates.filter(c => c.status === INTERVIEW_STATUS.COMPLETED);
    
    return {
      highly_recommended: completed.filter(c => c.totalScore >= 10),
      recommended: completed.filter(c => c.totalScore >= 7 && c.totalScore < 10),
      not_recommended: completed.filter(c => c.totalScore < 7)
    };
  }
);

export const {
  addCandidate,
  updateCandidateInterview,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  setFilterBy,
  setSelectedCandidate,
  removeCandidate,
  bulkRemoveCandidates,
  clearAllCandidates,
  calculateStats,
  markCandidateAsViewed,
  addCandidateNote,
  updateCandidateRating,
  setLoading,
  setError,
  clearError,
  importCandidates
} = candidateSlice.actions;

export default candidateSlice.reducer;