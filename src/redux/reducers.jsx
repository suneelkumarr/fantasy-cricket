// src/redux/reducers.js
const initialState = {
    fixtureData: null,
    completedData: { popular: null, overall: null },
    loading: false,
    error: null,
    viewMode: 'upcoming', // 'upcoming' or 'completed'
    completedFilter: 'popular', // 'popular' or 'overall'
  };
  
  const appReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_FIXTURE_DATA':
        return { ...state, fixtureData: action.payload };
      case 'SET_COMPLETED_DATA':
        return {
          ...state,
          completedData: {
            popular: action.payload.popular,
            overall: action.payload.overall,
          },
        };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload };
      case 'SET_VIEW_MODE':
        return { ...state, viewMode: action.payload };
      case 'SET_COMPLETED_FILTER':
        return { ...state, completedFilter: action.payload };
      default:
        return state;
    }
  };
  
  export default appReducer;