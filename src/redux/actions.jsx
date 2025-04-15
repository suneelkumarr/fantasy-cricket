// src/redux/actions.js
export const setFixtureData = (data) => ({
    type: 'SET_FIXTURE_DATA',
    payload: data,
  });
  
  export const setCompletedData = (popular, overall) => ({
    type: 'SET_COMPLETED_DATA',
    payload: { popular, overall },
  });
  
  export const setLoading = (loading) => ({
    type: 'SET_LOADING',
    payload: loading,
  });
  
  export const setError = (error) => ({
    type: 'SET_ERROR',
    payload: error,
  });
  
  export const setViewMode = (mode) => ({
    type: 'SET_VIEW_MODE',
    payload: mode,
  });
  
  export const setCompletedFilter = (filter) => ({
    type: 'SET_COMPLETED_FILTER',
    payload: filter,
  });